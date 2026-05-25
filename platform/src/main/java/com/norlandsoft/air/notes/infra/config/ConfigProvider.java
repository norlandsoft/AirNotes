package com.norlandsoft.air.notes.infra.config;

import com.norlandsoft.air.framework.sdk.storage.EmbeddedStorage;
import lombok.extern.slf4j.Slf4j;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * 基于 Redis + 本地缓存的 PaaS 配置提供者
 *
 * 替代原先的 ZkConfigProvider，使用本地 ConcurrentHashMap 缓存 + Redis String 存储
 * 实现配置管理和热更新。适用于单服务架构，配置变更通过进程内直接回调通知。
 *
 * 设计思路：
 * 1. 本地缓存作为主存储，提供零延迟的配置读取
 * 2. Redis String 作为辅助存储，便于运维查看和调试
 * 3. 配置变更时同步更新缓存 + Redis + 触发 watcher 回调
 * 4. Redis 不可用时降级为仅使用本地缓存，不影响服务运行
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@Slf4j
public class ConfigProvider {

  private static final String REDIS_KEY_PREFIX = "air:config:";

  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};
  private static final ConcurrentHashMap<String, Consumer<Map<String, Object>>> watchers =
      new ConcurrentHashMap<>();
  private static final ConcurrentHashMap<String, Map<String, Object>> configCache =
      new ConcurrentHashMap<>();
  private static volatile JedisPool jedisPool;

  /**
   * 从 EmbeddedStorage(H2) 预加载所有 paas 配置到本地缓存
   *
   * 在 Spring Bean 创建之前调用，解决循环依赖问题
   */
  public static void preloadFromEmbeddedStorage() {
    try {
      Map<String, String> paasConfig = EmbeddedStorage.getInstance().getGroup("paas");
      if (paasConfig == null || paasConfig.isEmpty()) {
        log.info("EmbeddedStorage 中无 paas 配置，跳过预加载");
        return;
      }

      int count = 0;
      for (Map.Entry<String, String> entry : paasConfig.entrySet()) {
        Map<String, Object> config = parseJson(entry.getValue());
        if (!config.isEmpty()) {
          configCache.put(entry.getKey(), config);
          count++;
        }
      }

      log.info("从 EmbeddedStorage 预加载 {} 项 paas 配置到缓存: {}", count, configCache.keySet());
    } catch (Exception e) {
      log.warn("从 EmbeddedStorage 预加载配置失败: {}", e.getMessage());
    }
  }

  public static synchronized void setJedisPool(JedisPool pool) {
    ConfigProvider.jedisPool = pool;
    log.info("ConfigProvider 已接收 JedisPool");
  }

  public static Map<String, Object> getDatabaseConfig() {
    return getConfig("machine_paas_database");
  }

  public static Map<String, Object> getRedisConfig() {
    return getConfig("machine_paas_redis");
  }

  public static Map<String, Object> getStorageConfig() {
    return getConfig("machine_paas_storage");
  }

  public static Map<String, Object> getGitConfig() {
    return getConfig("machine_paas_gitea");
  }

  public static Map<String, Object> getLibreOfficeConfig() {
    return getConfig("machine_paas_libreoffice");
  }

  public static Map<String, Object> getSearXNGConfig() {
    return getConfig("machine_paas_searxng");
  }

  public static Map<String, Object> getMinerUConfig() {
    return getConfig("machine_paas_mineru");
  }

  public static void watchDatabaseConfig(Consumer<Map<String, Object>> watcher) {
    watchConfig("machine_paas_database", watcher);
  }

  public static void watchRedisConfig(Consumer<Map<String, Object>> watcher) {
    watchConfig("machine_paas_redis", watcher);
  }

  public static void watchStorageConfig(Consumer<Map<String, Object>> watcher) {
    watchConfig("machine_paas_storage", watcher);
  }

  public static void watchGitConfig(Consumer<Map<String, Object>> watcher) {
    watchConfig("machine_paas_gitea", watcher);
  }

  public static void watchLibreOfficeConfig(Consumer<Map<String, Object>> watcher) {
    watchConfig("machine_paas_libreoffice", watcher);
  }

  public static void watchSearXNGConfig(Consumer<Map<String, Object>> watcher) {
    watchConfig("machine_paas_searxng", watcher);
  }

  public static void watchMinerUConfig(Consumer<Map<String, Object>> watcher) {
    watchConfig("machine_paas_mineru", watcher);
  }

  public static Map<String, Object> getConfig(String configKey) {
    Map<String, Object> cached = configCache.get(configKey);
    if (cached != null && !cached.isEmpty()) {
      return cached;
    }
    return Collections.emptyMap();
  }

  public static void watchConfig(String configKey, Consumer<Map<String, Object>> watcher) {
    if (watcher == null) {
      return;
    }

    watchers.put(configKey, watcher);

    try {
      Map<String, Object> config = getConfig(configKey);
      watcher.accept(config);
    } catch (Exception e) {
      log.warn("Watch 初始回调异常: configKey={}", configKey, e);
    }
  }

  public static void putConfig(String configKey, String jsonValue) {
    Map<String, Object> config = parseJson(jsonValue);
    configCache.put(configKey, config);

    if (jedisPool != null) {
      try (Jedis jedis = jedisPool.getResource()) {
        jedis.set(REDIS_KEY_PREFIX + configKey, jsonValue != null ? jsonValue : "");
        log.debug("配置已写入 Redis: {}", configKey);
      } catch (Exception e) {
        log.warn("写入配置到 Redis 失败: {}", configKey, e);
      }
    }

    notifyWatcher(configKey, config);
  }

  public static void removeConfig(String configKey) {
    configCache.remove(configKey);

    if (jedisPool != null) {
      try (Jedis jedis = jedisPool.getResource()) {
        jedis.del(REDIS_KEY_PREFIX + configKey);
        log.debug("配置已从 Redis 删除: {}", configKey);
      } catch (Exception e) {
        log.warn("从 Redis 删除配置失败: {}", configKey, e);
      }
    }

    notifyWatcher(configKey, Collections.emptyMap());
  }

  private static void notifyWatcher(String configKey, Map<String, Object> config) {
    Consumer<Map<String, Object>> watcher = watchers.get(configKey);
    if (watcher != null) {
      try {
        watcher.accept(config);
      } catch (Exception e) {
        log.warn("配置变更回调异常: configKey={}", configKey, e);
      }
    }
  }

  public static String getString(Map<String, Object> map, String key) {
    if (map == null) return "";
    Object v = map.get(key);
    return v != null ? v.toString() : "";
  }

  public static Integer getInteger(Map<String, Object> map, String key) {
    if (map == null) return null;
    Object v = map.get(key);
    if (v == null) return null;
    if (v instanceof Number) return ((Number) v).intValue();
    try {
      return Integer.parseInt(v.toString());
    } catch (NumberFormatException e) {
      return null;
    }
  }

  private static Map<String, Object> parseJson(String json) {
    if (json == null || json.trim().isEmpty()) {
      return Collections.emptyMap();
    }
    try {
      Map<String, Object> map = MAPPER.readValue(json, MAP_TYPE);
      return map != null ? map : Collections.emptyMap();
    } catch (Exception e) {
      return Collections.emptyMap();
    }
  }

  public static synchronized void shutdown() {
    jedisPool = null;
    log.info("ConfigProvider 已关闭");
  }
}
