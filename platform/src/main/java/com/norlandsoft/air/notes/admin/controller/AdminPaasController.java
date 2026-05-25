package com.norlandsoft.air.notes.admin.controller;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.admin.model.dto.DatabaseConfigSaveDTO;
import com.norlandsoft.air.notes.admin.model.dto.RedisConfigSaveDTO;
import com.norlandsoft.air.notes.admin.model.vo.DatabaseConfigVO;
import com.norlandsoft.air.notes.admin.model.vo.RedisConfigVO;
import com.norlandsoft.air.framework.sdk.storage.EmbeddedStorage;
import com.norlandsoft.air.notes.infra.config.ConfigProvider;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 管理员基础设施（PaaS）配置控制器
 *
 * 提供 admin 用户管理数据库和 Redis 连接配置的接口。
 * 配置持久化在 EmbeddedStorage（H2）的 paas 组，写入后通过 ConfigProvider
 * 同步触发 DynamicDataSource / DynamicRedisPool 的热更新。
 *
 * 接口路径：
 * - POST /admin/paas/database/get  获取数据库配置
 * - POST /admin/paas/database/save 保存数据库配置
 * - POST /admin/paas/redis/get     获取 Redis 配置
 * - POST /admin/paas/redis/save    保存 Redis 配置
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@RestController
@RequestMapping("/admin/paas")
public class AdminPaasController {

  private static final String PAAS_GROUP = "paas";
  private static final String DATABASE_KEY = "machine_paas_database";
  private static final String REDIS_KEY = "machine_paas_redis";
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

  /**
   * 获取数据库连接配置
   */
  @PostMapping("/database/get")
  public ActionResponse<DatabaseConfigVO> getDatabaseConfig() {
    try {
      String json = EmbeddedStorage.getInstance().get(PAAS_GROUP, DATABASE_KEY);
      DatabaseConfigVO vo = new DatabaseConfigVO();
      if (json != null && !json.trim().isEmpty()) {
        Map<String, Object> map = MAPPER.readValue(json, MAP_TYPE);
        if (map != null) {
          vo.setDriver(getString(map, "driver"));
          vo.setHost(getString(map, "host"));
          vo.setPort(getInteger(map, "port"));
          vo.setDatabase(getString(map, "database"));
          vo.setSchema(getString(map, "schema"));
          vo.setUsername(getString(map, "username"));
          vo.setPassword(getString(map, "password"));
          vo.setMinIdle(getInteger(map, "minIdle"));
          vo.setMaxIdle(getInteger(map, "maxIdle"));
          vo.setMaxTotal(getInteger(map, "maxTotal"));
          vo.setMaxWaitMillis(map.get("maxWaitMillis") != null ? ((Number) map.get("maxWaitMillis")).longValue() : null);
        }
      }
      return ActionResponse.success(vo, "获取数据库配置成功");
    } catch (Exception e) {
      return ActionResponse.error("990044", "获取数据库配置失败：" + e.getMessage());
    }
  }

  /**
   * 保存数据库连接配置
   *
   * 保存后自动触发 DynamicDataSource 重建连接池。
   */
  @PostMapping("/database/save")
  public ActionResponse<DatabaseConfigVO> saveDatabaseConfig(@RequestBody(required = false) DatabaseConfigSaveDTO dto) {
    try {
      if (dto == null) {
        return ActionResponse.error("990045", "请求参数不能为空");
      }
      Map<String, Object> map = new HashMap<>();
      map.put("driver", dto.getDriver() != null ? dto.getDriver() : "postgresql");
      map.put("host", dto.getHost() != null ? dto.getHost() : "");
      map.put("port", dto.getPort() != null ? dto.getPort() : 5432);
      map.put("database", dto.getDatabase() != null ? dto.getDatabase() : "");
      map.put("schema", dto.getSchema() != null ? dto.getSchema() : "public");
      map.put("username", dto.getUsername() != null ? dto.getUsername() : "");
      map.put("password", dto.getPassword() != null ? dto.getPassword() : "");
      map.put("minIdle", dto.getMinIdle() != null ? dto.getMinIdle() : 5);
      map.put("maxIdle", dto.getMaxIdle() != null ? dto.getMaxIdle() : 10);
      map.put("maxTotal", dto.getMaxTotal() != null ? dto.getMaxTotal() : 20);
      map.put("maxWaitMillis", dto.getMaxWaitMillis() != null ? dto.getMaxWaitMillis() : 30000L);
      String json = MAPPER.writeValueAsString(map);
      if (!EmbeddedStorage.getInstance().put(PAAS_GROUP, DATABASE_KEY, json)) {
        return ActionResponse.error("990046", "保存数据库配置失败");
      }
      // 双写：同步到 ConfigProvider，触发 DynamicDataSource 热更新
      ConfigProvider.putConfig(DATABASE_KEY, json);
      DatabaseConfigVO vo = new DatabaseConfigVO();
      vo.setDriver((String) map.get("driver"));
      vo.setHost((String) map.get("host"));
      vo.setPort((Integer) map.get("port"));
      vo.setDatabase((String) map.get("database"));
      vo.setSchema((String) map.get("schema"));
      vo.setUsername((String) map.get("username"));
      vo.setPassword((String) map.get("password"));
      vo.setMinIdle((Integer) map.get("minIdle"));
      vo.setMaxIdle((Integer) map.get("maxIdle"));
      vo.setMaxTotal((Integer) map.get("maxTotal"));
      vo.setMaxWaitMillis(map.get("maxWaitMillis") instanceof Number ? ((Number) map.get("maxWaitMillis")).longValue() : null);
      return ActionResponse.success(vo, "保存数据库配置成功");
    } catch (Exception e) {
      return ActionResponse.error("990047", "保存数据库配置失败：" + e.getMessage());
    }
  }

  /**
   * 获取 Redis 连接配置
   */
  @PostMapping("/redis/get")
  public ActionResponse<RedisConfigVO> getRedisConfig() {
    try {
      String json = EmbeddedStorage.getInstance().get(PAAS_GROUP, REDIS_KEY);
      RedisConfigVO vo = new RedisConfigVO();
      if (json != null && !json.trim().isEmpty()) {
        Map<String, Object> map = MAPPER.readValue(json, MAP_TYPE);
        if (map != null) {
          vo.setHost(getString(map, "host"));
          vo.setPort(getInteger(map, "port"));
          vo.setPassword(getString(map, "password"));
          vo.setDatabase(getInteger(map, "database"));
          vo.setMaxTotal(getInteger(map, "maxTotal"));
          vo.setMaxIdle(getInteger(map, "maxIdle"));
          vo.setMinIdle(getInteger(map, "minIdle"));
          vo.setMaxWaitMillis(map.get("maxWaitMillis") != null ? ((Number) map.get("maxWaitMillis")).longValue() : null);
        }
      }
      return ActionResponse.success(vo, "获取 Redis 配置成功");
    } catch (Exception e) {
      return ActionResponse.error("990052", "获取 Redis 配置失败：" + e.getMessage());
    }
  }

  /**
   * 保存 Redis 连接配置
   *
   * 保存后自动触发 DynamicRedisPool 重建连接池。
   */
  @PostMapping("/redis/save")
  public ActionResponse<RedisConfigVO> saveRedisConfig(@RequestBody(required = false) RedisConfigSaveDTO dto) {
    try {
      if (dto == null) {
        return ActionResponse.error("990053", "请求参数不能为空");
      }
      Map<String, Object> map = new HashMap<>();
      map.put("host", dto.getHost() != null ? dto.getHost() : "");
      map.put("port", dto.getPort() != null ? dto.getPort() : 6379);
      map.put("password", dto.getPassword() != null ? dto.getPassword() : "");
      map.put("database", dto.getDatabase() != null ? dto.getDatabase() : 0);
      map.put("maxTotal", dto.getMaxTotal() != null ? dto.getMaxTotal() : 128);
      map.put("maxIdle", dto.getMaxIdle() != null ? dto.getMaxIdle() : 64);
      map.put("minIdle", dto.getMinIdle() != null ? dto.getMinIdle() : 16);
      map.put("maxWaitMillis", dto.getMaxWaitMillis() != null ? dto.getMaxWaitMillis() : 3000L);
      String json = MAPPER.writeValueAsString(map);
      if (!EmbeddedStorage.getInstance().put(PAAS_GROUP, REDIS_KEY, json)) {
        return ActionResponse.error("990054", "保存 Redis 配置失败");
      }
      // 双写：同步到 ConfigProvider，触发 DynamicRedisPool 热更新
      ConfigProvider.putConfig(REDIS_KEY, json);
      RedisConfigVO vo = new RedisConfigVO();
      vo.setHost((String) map.get("host"));
      vo.setPort((Integer) map.get("port"));
      vo.setPassword((String) map.get("password"));
      vo.setDatabase((Integer) map.get("database"));
      vo.setMaxTotal((Integer) map.get("maxTotal"));
      vo.setMaxIdle((Integer) map.get("maxIdle"));
      vo.setMinIdle((Integer) map.get("minIdle"));
      vo.setMaxWaitMillis(map.get("maxWaitMillis") instanceof Number ? ((Number) map.get("maxWaitMillis")).longValue() : null);
      return ActionResponse.success(vo, "保存 Redis 配置成功");
    } catch (Exception e) {
      return ActionResponse.error("990055", "保存 Redis 配置失败：" + e.getMessage());
    }
  }

  private static String getString(Map<String, Object> map, String key) {
    Object v = map.get(key);
    return v != null ? v.toString() : "";
  }

  private static Integer getInteger(Map<String, Object> map, String key) {
    Object v = map.get(key);
    if (v == null) return null;
    if (v instanceof Number) return ((Number) v).intValue();
    try {
      return Integer.parseInt(v.toString());
    } catch (NumberFormatException e) {
      return null;
    }
  }
}
