package com.norlandsoft.air.notes.infra.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.dbcp2.BasicDataSource;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.time.Duration;
import java.util.Map;

/**
 * 动态数据源 -- 支持运行时配置热更新的数据库连接池包装器
 *
 * 实现 DataSource 接口的动态代理，内部持有 volatile 的 BasicDataSource（唯一连接池）。
 * 当 Admin 控制台修改数据库配置时，通过 ConfigProvider 的 watcher 回调触发连接池重建。
 *
 * 热更新策略（立即替换）：
 * 1. 通知去重 -- 500ms 时间窗口内重复通知自动忽略
 * 2. 配置指纹对比 -- 新旧配置指纹相同则跳过重建
 * 3. 立即替换 -- 销毁旧连接池，创建新连接池并设为当前数据源
 * 4. 异步验证 -- 后台线程验证新连接池可用性
 * 5. 失败重试 -- 验证失败时重建连接池（最多 3 次），之后进入 60s 冷却期
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@Slf4j
public class DynamicDataSource implements DataSource {

  private static final int MAX_RETRIES = 3;
  private static final long RETRY_BASE_INTERVAL_MS = 1000;
  private static final long NOTIFY_DEDUP_WINDOW_MS = 500;

  private volatile BasicDataSource realDataSource;
  private volatile String configFingerprint = "";
  private volatile int retryCount = 0;
  private volatile boolean available = true;
  private volatile String lastError = null;
  private volatile long lastNotifyTimestamp = 0;
  private volatile long retryCooldownUntil = 0;

  public synchronized void onConfigChange(Map<String, Object> newConfig) {
    long now = System.currentTimeMillis();

    if (now - lastNotifyTimestamp < NOTIFY_DEDUP_WINDOW_MS) {
      log.debug("数据库配置通知去重，跳过重复处理（间隔 {}ms）", now - lastNotifyTimestamp);
      return;
    }
    lastNotifyTimestamp = now;

    String newFingerprint = buildConfigFingerprint(newConfig);
    if (newFingerprint.equals(this.configFingerprint)) {
      log.info("数据库配置未变化，跳过连接池重建");
      return;
    }

    log.info("数据库配置已变更，开始重建连接池");

    retryCount = 0;
    available = true;
    lastError = null;
    retryCooldownUntil = 0;
    this.configFingerprint = newFingerprint;

    rebuildPool();
  }

  public void registerWatch() {
    try {
      ConfigProvider.watchDatabaseConfig(this::onConfigChange);
    } catch (Exception e) {
      log.warn("注册数据库配置监听失败: {}", e.getMessage());
    }
  }

  public synchronized void rebuildPool() {
    Map<String, Object> config;
    try {
      config = ConfigProvider.getDatabaseConfig();
    } catch (Exception e) {
      log.warn("读取数据库配置失败: {}", e.getMessage());
      handleConnectFailure("读取配置失败: " + e.getMessage());
      return;
    }

    if (config == null || config.isEmpty()) {
      log.debug("数据库配置为空，跳过连接");
      return;
    }

    String driver = getString(config, "driver", "org.postgresql.Driver");
    String host = getString(config, "host", null);
    Integer port = getInteger(config, "port", 5432);
    String database = getString(config, "database", null);
    String schema = getString(config, "schema", "public");
    String username = getString(config, "username", null);
    String password = getString(config, "password", null);

    driver = normalizeDriverClassName(driver);

    if (host == null || database == null || username == null) {
      handleConnectFailure("数据库配置不完整（缺少 host/database/username）");
      return;
    }

    String url = buildJdbcUrl(driver, host, port, database, schema);
    if (url == null) {
      handleConnectFailure("不支持的数据库驱动: " + driver);
      return;
    }

    int minIdle = getInteger(config, "minIdle", 5);
    int maxIdle = getInteger(config, "maxIdle", 10);
    int maxTotal = getInteger(config, "maxTotal", 20);
    long maxWaitMillis = getLong(config, "maxWaitMillis", 30000L);

    BasicDataSource newDS = new BasicDataSource();
    newDS.setUrl(url);
    newDS.setDriverClassName(driver);
    newDS.setUsername(username);
    newDS.setPassword(password);
    newDS.setMinIdle(minIdle);
    newDS.setMaxIdle(maxIdle);
    newDS.setMaxTotal(maxTotal);
    newDS.setMaxWait(Duration.ofMillis(maxWaitMillis));
    newDS.setTestOnBorrow(true);
    newDS.setValidationQuery("SELECT 1");

    BasicDataSource oldDS = this.realDataSource;
    this.realDataSource = newDS;

    if (oldDS != null) {
      Thread.ofVirtual().name("db-pool-close").start(() -> {
        closeDataSource(oldDS);
        log.debug("旧数据库连接池已关闭");
      });
    }

    log.info("数据库连接池已重建: {}", url);

    String finalDriver = driver;
    Thread.ofVirtual().name("db-connect-test").start(() -> {
      testConnection(newDS, host, port, database, finalDriver);
    });
  }

  private void testConnection(BasicDataSource ds,
                              String host, int port, String database, String driver) {
    try (Connection conn = ds.getConnection()) {
      try (var stmt = conn.createStatement()) {
        stmt.execute("SELECT 1");
      }

      log.info("数据库连接池验证通过: {}:{}/{} (driver: {})", host, port, database, driver);

      synchronized (DynamicDataSource.this) {
        if (this.realDataSource == ds) {
          retryCount = 0;
          available = true;
          lastError = null;
        }
      }
    } catch (Exception e) {
      log.warn("数据库连接池验证失败: {}:{}/{} - {}", host, port, database, e.getMessage());

      synchronized (DynamicDataSource.this) {
        if (this.realDataSource != ds) {
          log.debug("连接池已被替换，忽略验证失败");
          return;
        }
      }

      handleConnectFailure("连接验证失败: " + e.getMessage());
    }
  }

  private void handleConnectFailure(String error) {
    synchronized (DynamicDataSource.this) {
      retryCount++;
      lastError = error;
      log.warn("数据库连接失败（第{}/{}次）: {}", retryCount, MAX_RETRIES, error);

      if (retryCount >= MAX_RETRIES) {
        available = false;
        retryCooldownUntil = System.currentTimeMillis() + 60000;
        log.error("数据库连接已重试{}次失败，进入冷却期60s", MAX_RETRIES);

        BasicDataSource failed = this.realDataSource;
        this.realDataSource = null;
        closeDataSource(failed);
        return;
      }
    }

    long delay = RETRY_BASE_INTERVAL_MS * (1L << (retryCount - 1));
    Thread.ofVirtual().name("db-connect-retry").start(() -> {
      try {
        Thread.sleep(delay);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return;
      }
      rebuildPool();
    });
  }

  @Override
  public Connection getConnection() throws SQLException {
    ensureConnected();
    return realDataSource.getConnection();
  }

  @Override
  public Connection getConnection(String username, String password) throws SQLException {
    ensureConnected();
    return realDataSource.getConnection(username, password);
  }

  private void ensureConnected() throws SQLException {
    if (realDataSource != null && available) {
      return;
    }

    if (realDataSource == null && System.currentTimeMillis() < retryCooldownUntil) {
      throw new SQLException("数据库不可用（重试耗尽，冷却中" +
          (lastError != null ? "，原因: " + lastError : "") +
          "）。请通过 Admin 控制台修正数据库配置");
    }

    if (realDataSource == null) {
      if (!available) {
        log.info("数据库重试冷却期结束，重新尝试连接...");
        retryCount = 0;
        available = true;
        lastError = null;
        retryCooldownUntil = 0;
      }
      rebuildPool();
    }

    if (realDataSource == null) {
      throw new SQLException("数据库连接建立失败" +
          (lastError != null ? "（" + lastError + "）" : "") +
          "。请通过 Admin 控制台检查数据库配置");
    }
  }

  @Override
  public PrintWriter getLogWriter() throws SQLException {
    return realDataSource != null ? realDataSource.getLogWriter() : null;
  }

  @Override
  public void setLogWriter(PrintWriter out) throws SQLException {
    if (realDataSource != null) realDataSource.setLogWriter(out);
  }

  @Override
  public int getLoginTimeout() throws SQLException {
    return realDataSource != null ? realDataSource.getLoginTimeout() : 0;
  }

  @Override
  public void setLoginTimeout(int seconds) throws SQLException {
    if (realDataSource != null) realDataSource.setLoginTimeout(seconds);
  }

  @Override
  public java.util.logging.Logger getParentLogger() throws SQLFeatureNotSupportedException {
    if (realDataSource != null) return realDataSource.getParentLogger();
    throw new SQLFeatureNotSupportedException("数据库未配置");
  }

  @Override
  public <T> T unwrap(Class<T> iface) throws SQLException {
    if (iface.isInstance(this)) return iface.cast(this);
    if (realDataSource != null) return realDataSource.unwrap(iface);
    throw new SQLException("数据库未配置，无法解包: " + iface);
  }

  @Override
  public boolean isWrapperFor(Class<?> iface) throws SQLException {
    return iface.isInstance(this) ||
        (realDataSource != null && realDataSource.isWrapperFor(iface));
  }

  public boolean isAvailable() {
    return available && realDataSource != null;
  }

  public boolean isConfigured() {
    return realDataSource != null;
  }

  public String getStatus() {
    if (isAvailable()) return "已连接";
    if (!available) return "不可用（重试" + MAX_RETRIES + "次失败）";
    return "未配置";
  }

  public String getDataSourceInfo() {
    BasicDataSource ds = this.realDataSource;
    if (ds == null) {
      return "数据源未初始化";
    }
    try {
      return String.format(
          "url=%s, active=%d, idle=%d, maxTotal=%d, minIdle=%d, maxIdle=%d",
          ds.getUrl(), ds.getNumActive(), ds.getNumIdle(),
          ds.getMaxTotal(), ds.getMinIdle(), ds.getMaxIdle()
      );
    } catch (Exception e) {
      return "获取数据源信息异常: " + e.getMessage();
    }
  }

  public void close() {
    closeDataSource(realDataSource);
    realDataSource = null;
  }

  private void closeDataSource(BasicDataSource ds) {
    if (ds != null) {
      try {
        ds.close();
      } catch (Exception e) {
        log.warn("关闭数据源异常: {}", e.getMessage());
      }
    }
  }

  private String getString(Map<String, Object> config, String key, String defaultValue) {
    Object value = config.get(key);
    if (value == null) return defaultValue;
    String str = String.valueOf(value);
    return str.isBlank() ? defaultValue : str;
  }

  private Integer getInteger(Map<String, Object> config, String key, Integer defaultValue) {
    Object value = config.get(key);
    if (value == null) return defaultValue;
    if (value instanceof Number) return ((Number) value).intValue();
    try {
      return Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException e) {
      return defaultValue;
    }
  }

  private Long getLong(Map<String, Object> config, String key, Long defaultValue) {
    Object value = config.get(key);
    if (value == null) return defaultValue;
    if (value instanceof Number) return ((Number) value).longValue();
    try {
      return Long.parseLong(String.valueOf(value));
    } catch (NumberFormatException e) {
      return defaultValue;
    }
  }

  private String buildConfigFingerprint(Map<String, Object> config) {
    if (config == null || config.isEmpty()) {
      return "";
    }
    return String.join(":",
        nullToEmpty(getString(config, "driver", "")),
        nullToEmpty(getString(config, "host", "")),
        String.valueOf(getInteger(config, "port", 0)),
        nullToEmpty(getString(config, "database", "")),
        nullToEmpty(getString(config, "schema", "public")),
        nullToEmpty(getString(config, "username", "")),
        nullToEmpty(getString(config, "password", "")),
        String.valueOf(getInteger(config, "minIdle", 5)),
        String.valueOf(getInteger(config, "maxIdle", 10)),
        String.valueOf(getInteger(config, "maxTotal", 20)),
        String.valueOf(getLong(config, "maxWaitMillis", 30000L))
    );
  }

  private String nullToEmpty(String s) {
    return s != null ? s : "";
  }

  private String normalizeDriverClassName(String driver) {
    if (driver == null || driver.contains(".")) {
      return driver;
    }
    return switch (driver.toLowerCase()) {
      case "postgresql" -> "org.postgresql.Driver";
      case "mysql" -> "com.mysql.cj.jdbc.Driver";
      case "h2" -> "org.h2.Driver";
      default -> driver;
    };
  }

  private String buildJdbcUrl(String driver, String host, int port, String database, String schema) {
    if (driver == null || driver.contains("postgresql")) {
      String url = "jdbc:postgresql://" + host + ":" + port + "/" + database;
      if (schema != null && !schema.isBlank() && !schema.equals("public")) {
        url += "?currentSchema=" + schema;
      }
      return url;
    }
    if (driver.contains("mysql")) {
      return "jdbc:mysql://" + host + ":" + port + "/" + database;
    }
    if (driver.contains("h2")) {
      return "jdbc:h2:" + database;
    }
    return null;
  }
}
