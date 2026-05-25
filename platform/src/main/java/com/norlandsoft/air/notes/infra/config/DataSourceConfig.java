package com.norlandsoft.air.notes.infra.config;

import jakarta.annotation.PreDestroy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * 数据源配置
 *
 * 将 DynamicDataSource 注册为 Spring 的主数据源 Bean，
 * 支持 Admin 控制台运行时修改数据库配置后自动重建连接池。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@Configuration
public class DataSourceConfig {

  private DynamicDataSource dynamicDataSource;

  @Bean
  @Primary
  public DataSource dataSource() {
    dynamicDataSource = new DynamicDataSource();
    dynamicDataSource.registerWatch();
    return dynamicDataSource;
  }

  @PreDestroy
  public void destroy() {
    if (dynamicDataSource != null) {
      dynamicDataSource.close();
    }
  }
}
