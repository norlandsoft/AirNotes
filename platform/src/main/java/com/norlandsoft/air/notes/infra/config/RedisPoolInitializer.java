package com.norlandsoft.air.notes.infra.config;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Redis 连接池初始化器
 *
 * 使用 DynamicRedisPool 管理 Redis 连接池的完整生命周期。
 * registerWatch 注册配置变更监听后，首次回调自动触发连接池创建。
 * 配置为空时不创建连接池，不影响应用启动。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@Slf4j
@Component
@Order(1)
public class RedisPoolInitializer implements ApplicationRunner {

  private DynamicRedisPool dynamicRedisPool;

  @PostConstruct
  public void initWatch() {
    dynamicRedisPool = new DynamicRedisPool();
    dynamicRedisPool.registerWatch();
    log.info("DynamicRedisPool 已创建，已注册 Redis 配置变更监听");
  }

  @Override
  public void run(ApplicationArguments args) {
    // registerWatch 的首次回调已自动触发连接池创建
  }

  @PreDestroy
  public void destroy() {
    if (dynamicRedisPool != null) {
      dynamicRedisPool.close();
      log.info("DynamicRedisPool 已关闭");
    }
  }
}
