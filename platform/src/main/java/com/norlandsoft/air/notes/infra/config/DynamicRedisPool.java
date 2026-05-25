package com.norlandsoft.air.notes.infra.config;

import com.norlandsoft.air.framework.sdk.redis.JedisPoolHolder;
import lombok.extern.slf4j.Slf4j;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

import java.time.Duration;
import java.util.Map;

/**
 * 动态 Redis 连接池 -- 支持运行时配置热更新的 JedisPool 包装器
 *
 * 当 Admin 控制台修改 Redis 配置时，通过 ConfigProvider 的 watcher 回调触发连接池重建。
 * 同时作为 JedisPoolHolder 的注入源，使 RedisClient 等静态工具类自动使用新连接池。
 *
 * 热更新策略：
 * 1. 通知去重 -- 500ms 时间窗口内重复通知自动忽略
 * 2. 配置指纹对比 -- 新旧配置指纹相同则跳过重建
 * 3. 立即替换 -- 销毁旧连接池，创建新连接池
 * 4. 异步验证 -- 后台线程验证新连接池可用性
 * 5. 失败重试 -- 最多 3 次，之后进入 60s 冷却期
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@Slf4j
public class DynamicRedisPool {

  private static final int MAX_RETRIES = 3;
  private static final long RETRY_BASE_INTERVAL_MS = 1000;
  private static final long NOTIFY_DEDUP_WINDOW_MS = 500;

  private volatile JedisPool realPool;
  private volatile String configFingerprint = "";
  private volatile int retryCount = 0;
  private volatile boolean available = true;
  private volatile String lastError = null;
  private volatile long lastNotifyTimestamp = 0;
  private volatile long retryCooldownUntil = 0;

  /**
   * 配置变更回调，由 ConfigProvider watcher 触发
   */
  public synchronized void onConfigChange(Map<String, Object> newConfig) {
    long now = System.currentTimeMillis();

    if (now - lastNotifyTimestamp < NOTIFY_DEDUP_WINDOW_MS) {
      log.debug("Redis 配置通知去重，跳过");
      return;
    }
    lastNotifyTimestamp = now;

    String newFingerprint = buildConfigFingerprint(newConfig);
    if (newFingerprint.equals(this.configFingerprint)) {
      log.info("Redis 配置未变化，跳过连接池重建");
      return;
    }

    log.info("Redis 配置已变更，开始重建连接池");

    retryCount = 0;
    available = true;
    lastError = null;
    retryCooldownUntil = 0;
    this.configFingerprint = newFingerprint;

    rebuildPool();
  }

  /**
   * 注册 Redis 配置变更监听
   */
  public void registerWatch() {
    try {
      ConfigProvider.watchRedisConfig(this::onConfigChange);
    } catch (Exception e) {
      log.warn("注册 Redis 配置监听失败: {}", e.getMessage());
    }
  }

  /**
   * 从 ConfigProvider 读取配置并重建连接池
   */
  public synchronized void rebuildPool() {
    Map<String, Object> config;
    try {
      config = ConfigProvider.getRedisConfig();
    } catch (Exception e) {
      log.warn("读取 Redis 配置失败: {}", e.getMessage());
      handleConnectFailure("读取配置失败: " + e.getMessage());
      return;
    }

    if (config == null || config.isEmpty()) {
      log.debug("Redis 配置为空，跳过连接");
      return;
    }

    String host = getString(config, "host", "localhost");
    int port = getInteger(config, "port", 6379);
    String password = getString(config, "password", null);
    int database = getInteger(config, "database", 0);

    int maxTotal = getInteger(config, "maxTotal", 128);
    int maxIdle = getInteger(config, "maxIdle", 64);
    int minIdle = getInteger(config, "minIdle", 16);
    long maxWaitMillis = getLong(config, "maxWaitMillis", 3000L);

    JedisPoolConfig poolConfig = new JedisPoolConfig();
    poolConfig.setMaxTotal(maxTotal);
    poolConfig.setMaxIdle(maxIdle);
    poolConfig.setMinIdle(minIdle);
    poolConfig.setMaxWait(Duration.ofMillis(maxWaitMillis));
    poolConfig.setTestWhileIdle(true);
    poolConfig.setMinEvictableIdleDuration(Duration.ofSeconds(30));
    poolConfig.setTimeBetweenEvictionRuns(Duration.ofSeconds(30));
    poolConfig.setNumTestsPerEvictionRun(3);
    poolConfig.setBlockWhenExhausted(true);
    poolConfig.setFairness(true);

    String effectivePassword = (password != null && !password.isBlank()) ? password : null;

    JedisPool newPool = new JedisPool(poolConfig, host, port, 5000, 5000,
        effectivePassword, database, null);

    JedisPool oldPool = this.realPool;
    this.realPool = newPool;

    JedisPoolHolder.setPool(newPool);

    if (oldPool != null) {
      Thread.ofVirtual().name("redis-pool-close").start(() -> {
        closePool(oldPool);
        log.debug("旧 Redis 连接池已关闭");
      });
    }

    log.info("Redis 连接池已重建: {}:{}/{}", host, port, database);

    Thread.ofVirtual().name("redis-connect-test").start(() -> {
      testConnection(newPool, host, port, database);
    });
  }

  private void testConnection(JedisPool pool, String host, int port, int database) {
    try (Jedis jedis = pool.getResource()) {
      String pong = jedis.ping();
      if (!"PONG".equalsIgnoreCase(pong)) {
        throw new RuntimeException("PING 返回异常: " + pong);
      }

      log.info("Redis 连接池验证通过: {}:{}/{}", host, port, database);

      synchronized (DynamicRedisPool.this) {
        if (this.realPool == pool) {
          retryCount = 0;
          available = true;
          lastError = null;
        }
      }
    } catch (Exception e) {
      log.warn("Redis 连接池验证失败: {}:{}/{} - {}", host, port, database, e.getMessage());

      synchronized (DynamicRedisPool.this) {
        if (this.realPool != pool) {
          log.debug("连接池已被替换，忽略验证失败");
          return;
        }
      }

      handleConnectFailure("连接验证失败: " + e.getMessage());
    }
  }

  private void handleConnectFailure(String error) {
    synchronized (DynamicRedisPool.this) {
      retryCount++;
      lastError = error;
      log.warn("Redis 连接失败（第{}/{}次）: {}", retryCount, MAX_RETRIES, error);

      if (retryCount >= MAX_RETRIES) {
        available = false;
        retryCooldownUntil = System.currentTimeMillis() + 60000;
        log.error("Redis 连接已重试{}次失败，进入冷却期60s", MAX_RETRIES);

        JedisPool failed = this.realPool;
        this.realPool = null;
        JedisPoolHolder.setPool(null);
        closePool(failed);
        return;
      }
    }

    long delay = RETRY_BASE_INTERVAL_MS * (1L << (retryCount - 1));
    Thread.ofVirtual().name("redis-connect-retry").start(() -> {
      try {
        Thread.sleep(delay);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return;
      }
      rebuildPool();
    });
  }

  public boolean isAvailable() {
    return available && realPool != null && !realPool.isClosed();
  }

  public String getStatus() {
    if (isAvailable()) return "已连接";
    if (!available) return "不可用（重试" + MAX_RETRIES + "次失败）";
    return "未配置";
  }

  public void close() {
    closePool(realPool);
    realPool = null;
  }

  private void closePool(JedisPool pool) {
    if (pool != null) {
      try {
        if (!pool.isClosed()) {
          pool.close();
        }
      } catch (Exception e) {
        log.warn("关闭连接池异常: {}", e.getMessage());
      }
    }
  }

  private String getString(Map<String, Object> config, String key, String defaultValue) {
    Object value = config.get(key);
    if (value == null) return defaultValue;
    String str = String.valueOf(value);
    return str.isBlank() ? defaultValue : str;
  }

  private int getInteger(Map<String, Object> config, String key, int defaultValue) {
    Object value = config.get(key);
    if (value == null) return defaultValue;
    if (value instanceof Number) return ((Number) value).intValue();
    try { return Integer.parseInt(String.valueOf(value)); }
    catch (NumberFormatException e) { return defaultValue; }
  }

  private long getLong(Map<String, Object> config, String key, long defaultValue) {
    Object value = config.get(key);
    if (value == null) return defaultValue;
    if (value instanceof Number) return ((Number) value).longValue();
    try { return Long.parseLong(String.valueOf(value)); }
    catch (NumberFormatException e) { return defaultValue; }
  }

  private String buildConfigFingerprint(Map<String, Object> config) {
    if (config == null || config.isEmpty()) {
      return "";
    }
    return String.join(":",
        nullToEmpty(getString(config, "host", "")),
        String.valueOf(getInteger(config, "port", 0)),
        nullToEmpty(getString(config, "password", "")),
        String.valueOf(getInteger(config, "database", 0)),
        String.valueOf(getInteger(config, "maxTotal", 128)),
        String.valueOf(getInteger(config, "maxIdle", 64)),
        String.valueOf(getInteger(config, "minIdle", 16)),
        String.valueOf(getLong(config, "maxWaitMillis", 3000L))
    );
  }

  private String nullToEmpty(String s) {
    return s != null ? s : "";
  }
}
