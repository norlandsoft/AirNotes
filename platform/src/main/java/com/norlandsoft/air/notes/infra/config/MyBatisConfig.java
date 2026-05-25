package com.norlandsoft.air.notes.infra.config;

import org.apache.ibatis.session.Configuration;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;
import java.io.IOException;

/**
 * MyBatis 配置
 *
 * 配置 SqlSessionFactory，指定 Mapper XML 扫描路径和实体类别名包。
 * 通过 @MapperScan 注册 Mapper 接口，替代 mybatis-spring-boot-starter 的自动配置。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@org.springframework.context.annotation.Configuration
@MapperScan("com.norlandsoft.air.notes.mapper")
public class MyBatisConfig {

  @Autowired
  private DataSource dataSource;

  @Bean
  public SqlSessionFactoryBean sqlSessionFactory() throws IOException {
    SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
    factoryBean.setDataSource(dataSource);

    PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
    factoryBean.setMapperLocations(resolver.getResources("classpath*:com/norlandsoft/air/**/mapper/*.xml"));
    factoryBean.setTypeAliasesPackage("com.norlandsoft.air.notes.model.entity");

    Configuration configuration = new Configuration();
    configuration.setMapUnderscoreToCamelCase(true);
    configuration.setLogImpl(org.apache.ibatis.logging.slf4j.Slf4jImpl.class);
    factoryBean.setConfiguration(configuration);

    return factoryBean;
  }
}
