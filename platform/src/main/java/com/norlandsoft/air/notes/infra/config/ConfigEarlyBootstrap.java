package com.norlandsoft.air.notes.infra.config;

import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.annotation.Configuration;

/**
 * 配置早期引导
 *
 * 在所有 Spring Bean 创建之前，从 EmbeddedStorage(H2) 预加载 paas 配置到 ConfigProvider 缓存。
 * 解决循环依赖问题：DynamicDataSource 和 DynamicRedisPool 需要配置才能初始化，
 * 但 ConfigProvider 的缓存需要先从 H2 加载。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@Configuration
public class ConfigEarlyBootstrap implements BeanFactoryPostProcessor {

  @Override
  public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
    ConfigProvider.preloadFromEmbeddedStorage();
  }
}
