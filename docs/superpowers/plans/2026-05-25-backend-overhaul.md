# AirNotes Backend Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure AirNotes backend to match AirDirector's architecture — replace hand-rolled utilities with framework-sdk, introduce dual-tier auth (admin local + SSO), adopt DynamicDataSource/Redis, migrate controllers to typed DTOs, unify datetime serialization.

**Architecture:** Single framework-sdk dependency provides all transitives. Two-tier auth via servlet filters (AdminAuthFilter order=0, SsoAuthFilter order=1 from SDK). DynamicDataSource/Redis configured at runtime through admin PaaS UI. Admin credentials in EmbeddedStorage (H2), non-admin users authenticated via Framework SSO service.

**Tech Stack:** Java 21, Spring Boot 4.1.0-M4, framework-sdk 1.0.0, MyBatis 3.5.19, PostgreSQL, H2 (EmbeddedStorage), Jedis (Redis)

---

## File Structure

### New files to create

```
platform/src/main/java/com/norlandsoft/air/notes/
  config/
    AdminAuthConfig.java
  infra/
    auth/
      AdminAuthFilter.java
    config/
      ConfigEarlyBootstrap.java
      ConfigProvider.java
      DataSourceConfig.java
      DynamicDataSource.java
      DynamicRedisPool.java
      MyBatisConfig.java
      RedisPoolInitializer.java
  admin/
    controller/
      AdminUserController.java
      InitialAdminPasswordController.java
      AdminPaasController.java
    service/
      AdminUserService.java
      impl/AdminUserServiceImpl.java
    model/
      dto/
        AdminLoginRequest.java
        AdminPasswordResetDTO.java
        DatabaseConfigSaveDTO.java
        RedisConfigSaveDTO.java
      vo/
        AdminUserInfo.java
        AdminLoginResponse.java
      entity/
        AdminSession.java
  controller/
    SsoLoginProxyController.java
  model/
    dto/
      WikiSpaceCreateDTO.java
      WikiSpaceUpdateDTO.java
      DocUpdateDTO.java
      DocMenuQueryDTO.java
      MindNodeUpdateDTO.java
      MindNodeQueryDTO.java
```

### Files to modify

```
pom.xml (parent)
platform/pom.xml
platform/src/main/java/com/norlandsoft/air/notes/AirNotes.java
platform/src/main/resources/application.yml
platform/src/main/java/com/norlandsoft/air/notes/controller/WikiSpaceController.java
platform/src/main/java/com/norlandsoft/air/notes/controller/WikiDocsController.java
platform/src/main/java/com/norlandsoft/air/notes/service/WikiSpaceService.java
platform/src/main/java/com/norlandsoft/air/notes/service/WikiDocsService.java
platform/src/main/java/com/norlandsoft/air/notes/service/impl/WikiSpaceServiceImpl.java
platform/src/main/java/com/norlandsoft/air/notes/service/impl/WikiDocsServiceImpl.java
frontend/src/utils/StringUtils.ts
frontend/src/pages/Wiki/space/SpaceList.tsx
```

### Files to delete

```
platform/src/main/java/com/norlandsoft/air/notes/commons/ActionResponse.java
platform/src/main/java/com/norlandsoft/air/notes/commons/JwtUtils.java
platform/src/main/java/com/norlandsoft/air/notes/commons/PasswordUtils.java
platform/src/main/java/com/norlandsoft/air/notes/utils/CryptoUtils.java
platform/src/main/java/com/norlandsoft/air/notes/utils/IDGenerator.java
platform/src/main/java/com/norlandsoft/air/notes/utils/TemplateUtils.java
platform/src/main/java/com/norlandsoft/air/notes/model/entity/User.java
platform/src/main/java/com/norlandsoft/air/notes/mapper/UserMapper.java
platform/src/main/java/com/norlandsoft/air/notes/mapper/UserMapper.xml
platform/src/main/java/com/norlandsoft/air/notes/controller/UserController.java
platform/src/main/java/com/norlandsoft/air/notes/service/UserService.java
platform/src/main/java/com/norlandsoft/air/notes/service/impl/UserServiceImpl.java
platform/src/main/resources/db/schema_user.sql
```

---

### Task 1: Restructure POM dependencies

**Files:**
- Modify: `pom.xml`
- Modify: `platform/pom.xml`

- [ ] **Step 1: Rewrite parent pom.xml**

Replace the full content of `pom.xml`. Remove all direct dependencies (spring-boot-starter-web, log4j2, jdbc, dbcp2, mybatis, postgresql, jakarta, jjwt, lombok, hutool, commons-io). Keep parent, BOM, modules, repositories, and build config.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.1.0-M4</version>
        <relativePath/>
    </parent>

    <groupId>com.norlandsoft</groupId>
    <artifactId>AirNotes</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>
    <name>Air Notes</name>

    <properties>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.norlandsoft</groupId>
                <artifactId>air-framework-dependencies</artifactId>
                <version>1.2.0</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <modules>
      <module>platform</module>
    </modules>

    <repositories>
        <repository>
            <id>spring-milestone</id>
            <url>https://repo.spring.io/milestone</url>
        </repository>
        <repository>
            <id>github</id>
            <url>https://maven.pkg.github.com/norlandsoft/air-framework-dependencies</url>
        </repository>
    </repositories>

    <build>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <includes>
                    <include>**/*.*</include>
                </includes>
            </resource>
            <resource>
                <directory>src/main/java</directory>
                <includes>
                    <include>**/*.xml</include>
                    <include>**/*.json</include>
                </includes>
            </resource>
        </resources>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

- [ ] **Step 2: Rewrite platform pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://maven.apache.org/POM/4.0.0"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <parent>
    <groupId>com.norlandsoft</groupId>
    <artifactId>AirNotes</artifactId>
    <version>1.0.0</version>
    <relativePath>../pom.xml</relativePath>
  </parent>
  <modelVersion>4.0.0</modelVersion>

  <artifactId>platform</artifactId>
  <packaging>jar</packaging>

  <dependencies>
    <dependency>
      <groupId>com.norlandsoft</groupId>
      <artifactId>framework-sdk</artifactId>
      <version>1.0.0</version>
    </dependency>
  </dependencies>

  <build>
    <finalName>air-notes-platform</finalName>
  </build>

</project>
```

- [ ] **Step 3: Commit**

```bash
git add pom.xml platform/pom.xml
git commit -m "重构 POM 依赖：统一使用 framework-sdk 替换所有直接依赖"
```

---

### Task 2: Update application.yml and main class

**Files:**
- Modify: `platform/src/main/resources/application.yml`
- Modify: `platform/src/main/java/com/norlandsoft/air/notes/AirNotes.java`

- [ ] **Step 1: Rewrite application.yml**

移除静态数据源配置，添加 Jackson 日期格式和 Tomcat 调优配置。

```yaml
server:
  port: 6600
  tomcat:
    connection-timeout: 0
    threads.max: 200
    max-connections: 10000
    accept-count: 100

spring:
  application:
    name: air-notes
  jackson:
    default-property-inclusion: non_null
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: GMT+8
  servlet:
    multipart:
      max-file-size: -1
      max-request-size: -1
```

- [ ] **Step 2: Rewrite AirNotes.java**

添加工作空间初始化和日志配置，移除 @MapperScan（由 MyBatisConfig 处理）。

```java
/**
 * AirNotes 应用入口
 *
 * Wiki 知识库服务主启动类。framework-sdk 的 SSO 自动配置通过
 * @ConditionalOnProperty(framework.address) 控制，仅在配置了
 * Framework 服务地址时激活。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes;

import com.norlandsoft.air.framework.sdk.app.AppManager;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class AirNotes {

    public static void main(String[] args) {
        String workspace = AppManager.getApplicationWorkspace();

        // 设置日志目录
        System.setProperty("log.path", workspace + File.separator + "logs");
        System.setProperty("log.name", "air-notes");
        System.setProperty("log.level", "debug");

        SpringApplication.run(AirNotes.class, args);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add platform/src/main/resources/application.yml platform/src/main/java/com/norlandsoft/air/notes/AirNotes.java
git commit -m "更新 application.yml 和启动类：移除静态数据源，添加 Jackson 日期格式配置"
```

---

### Task 3: Delete old utility/commons/user files

**Files to delete:**
- `platform/src/main/java/com/norlandsoft/air/notes/commons/ActionResponse.java`
- `platform/src/main/java/com/norlandsoft/air/notes/commons/JwtUtils.java`
- `platform/src/main/java/com/norlandsoft/air/notes/commons/PasswordUtils.java`
- `platform/src/main/java/com/norlandsoft/air/notes/utils/CryptoUtils.java`
- `platform/src/main/java/com/norlandsoft/air/notes/utils/IDGenerator.java`
- `platform/src/main/java/com/norlandsoft/air/notes/utils/TemplateUtils.java`
- `platform/src/main/java/com/norlandsoft/air/notes/model/entity/User.java`
- `platform/src/main/java/com/norlandsoft/air/notes/mapper/UserMapper.java`
- `platform/src/main/java/com/norlandsoft/air/notes/mapper/UserMapper.xml`
- `platform/src/main/java/com/norlandsoft/air/notes/controller/UserController.java`
- `platform/src/main/java/com/norlandsoft/air/notes/service/UserService.java`
- `platform/src/main/java/com/norlandsoft/air/notes/service/impl/UserServiceImpl.java`
- `platform/src/main/resources/db/schema_user.sql`

- [ ] **Step 1: Delete all files**

```bash
cd /opt/AirNotes
rm -f platform/src/main/java/com/norlandsoft/air/notes/commons/ActionResponse.java
rm -f platform/src/main/java/com/norlandsoft/air/notes/commons/JwtUtils.java
rm -f platform/src/main/java/com/norlandsoft/air/notes/commons/PasswordUtils.java
rm -f platform/src/main/java/com/norlandsoft/air/notes/utils/CryptoUtils.java
rm -f platform/src/main/java/com/norlandsoft/air/notes/utils/IDGenerator.java
rm -f platform/src/main/java/com/norlandsoft/air/notes/utils/TemplateUtils.java
rm -f platform/src/main/java/com/norlandsoft/air/notes/model/entity/User.java
rm -f platform/src/main/java/com/norlandsoft/air/notes/mapper/UserMapper.java
rm -f platform/src/main/java/com/norlandsoft/air/notes/mapper/UserMapper.xml
rm -f platform/src/main/java/com/norlandsoft/air/notes/controller/UserController.java
rm -f platform/src/main/java/com/norlandsoft/air/notes/service/UserService.java
rm -f platform/src/main/java/com/norlandsoft/air/notes/service/impl/UserServiceImpl.java
rm -f platform/src/main/resources/db/schema_user.sql
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "删除旧的工具类、用户模块和 commons 包：改用 framework-sdk 提供的对应功能"
```

---

### Task 4: Create admin model classes

**Files:**
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/model/dto/AdminLoginRequest.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/model/dto/AdminPasswordResetDTO.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/model/dto/DatabaseConfigSaveDTO.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/model/dto/RedisConfigSaveDTO.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/model/vo/AdminUserInfo.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/model/vo/AdminLoginResponse.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/model/entity/AdminSession.java`

- [ ] **Step 1: Create AdminLoginRequest.java**

```java
/**
 * 管理员登录请求 DTO
 *
 * 与平台 UserLoginDTO 字段一致，供前端统一传参。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.dto;

import lombok.Data;

@Data
public class AdminLoginRequest {
    /** 用户 ID，admin 登录时为 "admin" */
    private String id;
    /** 密码，前端传输前已 SHA256 加密 */
    private String password;
}
```

- [ ] **Step 2: Create AdminPasswordResetDTO.java**

```java
/**
 * 管理员密码重置请求 DTO
 *
 * 用于接收修改 admin 密码的请求，密码由前端 SHA256 加密后传输。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.dto;

import lombok.Data;

@Data
public class AdminPasswordResetDTO {
    /** 新密码，前端传输前已 SHA256 加密；不提供则使用默认密码 123456 */
    private String password;
}
```

- [ ] **Step 3: Create DatabaseConfigSaveDTO.java**

```java
/**
 * 数据库配置保存 DTO
 *
 * 用于接收前端保存数据库连接的请求参数。
 * 持久化到 EmbeddedStorage（H2）的 paas 组。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.dto;

import lombok.Data;

@Data
public class DatabaseConfigSaveDTO {
    /** 驱动类型，如 postgresql、mysql */
    private String driver;
    /** 主机地址 */
    private String host;
    /** 端口 */
    private Integer port;
    /** 数据库名 */
    private String database;
    /** 数据库 Schema，默认 public */
    private String schema;
    /** 用户名 */
    private String username;
    /** 密码 */
    private String password;
    /** 最小空闲连接数（默认 5） */
    private Integer minIdle;
    /** 最大空闲连接数（默认 10） */
    private Integer maxIdle;
    /** 最大总连接数（默认 20） */
    private Integer maxTotal;
    /** 获取连接最大等待毫秒（默认 30000） */
    private Long maxWaitMillis;
}
```

- [ ] **Step 4: Create RedisConfigSaveDTO.java**

```java
/**
 * Redis 配置保存 DTO
 *
 * 用于接收前端保存 Redis 连接的请求参数。
 * 持久化到 EmbeddedStorage（H2）的 paas 组。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.dto;

import lombok.Data;

@Data
public class RedisConfigSaveDTO {
    /** 主机地址 */
    private String host;
    /** 端口 */
    private Integer port;
    /** 密码 */
    private String password;
    /** 数据库索引，0-15 */
    private Integer database;
    /** 最大总连接数（默认 128） */
    private Integer maxTotal;
    /** 最大空闲连接数（默认 64） */
    private Integer maxIdle;
    /** 最小空闲连接数（默认 16） */
    private Integer minIdle;
    /** 获取连接最大等待毫秒（默认 3000） */
    private Long maxWaitMillis;
}
```

- [ ] **Step 5: Create AdminUserInfo.java**

```java
/**
 * 管理员用户信息 VO
 *
 * 仅包含展示字段，不含密码等敏感信息。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.vo;

import lombok.Data;

@Data
public class AdminUserInfo {
    private String id;
    private String loginId;
    private String name;
    private String role;
    private String status;
    private String avatar;
}
```

- [ ] **Step 6: Create AdminLoginResponse.java**

```java
/**
 * 管理员登录响应 VO
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.vo;

import lombok.Data;

@Data
public class AdminLoginResponse {
    private String token;
    private AdminUserInfo user;
}
```

- [ ] **Step 7: Create AdminSession.java**

```java
/**
 * 管理员会话实体（存 EmbeddedStorage）
 *
 * 用于序列化存入本地存储，时间字段统一使用 LocalDateTime，
 * Jackson 序列化时自动格式化为 yyyy-MM-dd HH:mm:ss 字符串。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminSession {
    private String sessionId;
    private String userId;
    private String userName;
    private String userRole;
    /** 创建时间 */
    private LocalDateTime createTime;
    /** 最后访问时间 */
    private LocalDateTime lastAccessTime;
    /** 过期时间 */
    private LocalDateTime expireTime;
}
```

- [ ] **Step 8: Commit**

```bash
git add platform/src/main/java/com/norlandsoft/air/notes/admin/
git commit -m "添加 admin 模块模型类：DTO、VO、Entity"
```

---

### Task 5: Create infra config layer

**Files:**
- Create: `platform/src/main/java/com/norlandsoft/air/notes/infra/config/ConfigEarlyBootstrap.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/infra/config/ConfigProvider.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/infra/config/DataSourceConfig.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/infra/config/DynamicDataSource.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/infra/config/DynamicRedisPool.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/infra/config/MyBatisConfig.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/infra/config/RedisPoolInitializer.java`

- [ ] **Step 1: Create ConfigEarlyBootstrap.java**

```java
/**
 * 配置早期引导
 *
 * 在所有 Spring Bean 创建之前，从 EmbeddedStorage(H2) 预加载 paas 配置到 ConfigProvider 缓存。
 * 解决循环依赖问题：DynamicDataSource 和 DynamicRedisPool 需要配置才能初始化，
 * 但 ConfigProvider 的缓存需要先从 H2 加载。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.infra.config;

import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConfigEarlyBootstrap implements BeanFactoryPostProcessor {

  @Override
  public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
    ConfigProvider.preloadFromEmbeddedStorage();
  }
}
```

- [ ] **Step 2: Create ConfigProvider.java**

从 AirDirector 的 `com.norlandsoft.air.platform.infra.config.ConfigProvider` 复制，包名改为 `com.norlandsoft.air.notes.infra.config`。代码与 AirDirector 版本完全相同（ConfigProvider 是静态工具类，包名无关紧要）。

完整代码见 AirDirector 源文件，仅改包名：
- `package com.norlandsoft.air.notes.infra.config;`
- import 保持不变（使用 framework-sdk 的 EmbeddedStorage）
- 其余代码一字不差

- [ ] **Step 3: Create DataSourceConfig.java**

```java
/**
 * 数据源配置
 *
 * 将 DynamicDataSource 注册为 Spring 的主数据源 Bean，
 * 支持 Admin 控制台运行时修改数据库配置后自动重建连接池。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.infra.config;

import jakarta.annotation.PreDestroy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

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
```

- [ ] **Step 4: Create DynamicDataSource.java**

从 AirDirector 的 `com.norlandsoft.air.platform.infra.config.DynamicDataSource` 复制，包名改为 `com.norlandsoft.air.notes.infra.config`。

完整代码见 AirDirector 源文件，仅改包名。其余代码（包括所有字段、方法、内部逻辑）一字不差。

- [ ] **Step 5: Create DynamicRedisPool.java**

从 AirDirector 的 `com.norlandsoft.air.platform.infra.config.DynamicRedisPool` 复制，包名改为 `com.norlandsoft.air.notes.infra.config`。

完整代码见 AirDirector 源文件，仅改包名。

- [ ] **Step 6: Create MyBatisConfig.java**

```java
/**
 * MyBatis 配置
 *
 * 配置 SqlSessionFactory，指定 Mapper XML 扫描路径。
 * 通过 @MapperScan 注册 Mapper 接口，替代 mybatis-spring-boot-starter 的自动配置。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.infra.config;

import org.apache.ibatis.session.Configuration;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;
import java.io.IOException;

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
```

- [ ] **Step 7: Create RedisPoolInitializer.java**

```java
/**
 * Redis 连接池初始化器
 *
 * 使用 DynamicRedisPool 管理 Redis 连接池的完整生命周期。
 * registerWatch 注册配置变更监听后，首次回调自动触发连接池创建。
 * 配置为空时不创建连接池，不影响应用启动。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.infra.config;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

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
```

- [ ] **Step 8: Commit**

```bash
git add platform/src/main/java/com/norlandsoft/air/notes/infra/
git commit -m "添加基础设施配置层：DynamicDataSource、DynamicRedisPool、ConfigProvider、MyBatisConfig"
```

---

### Task 6: Create auth layer

**Files:**
- Create: `platform/src/main/java/com/norlandsoft/air/notes/infra/auth/AdminAuthFilter.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/config/AdminAuthConfig.java`

- [ ] **Step 1: Create AdminAuthFilter.java**

从 AirDirector 复制，包名改为 `com.norlandsoft.air.notes.infra.auth`，import 中 `AdminUserService` 改为 `com.norlandsoft.air.notes.admin.service.AdminUserService`。

完整代码见 AirDirector 源文件 `/opt/AirDirector/platform/src/main/java/com/norlandsoft/air/platform/infra/auth/AdminAuthFilter.java`，需修改：
- `package com.norlandsoft.air.notes.infra.auth;`
- `import com.norlandsoft.air.notes.admin.service.AdminUserService;`
- 其余代码一字不差

- [ ] **Step 2: Create AdminAuthConfig.java**

```java
/**
 * Admin 认证过滤器配置
 *
 * 注册 AdminAuthFilter 到所有路径，过滤器内部判断是否拦截。
 * order=0 确保在 SsoAuthFilter（order=1）之前执行。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.config;

import com.norlandsoft.air.notes.admin.service.AdminUserService;
import com.norlandsoft.air.notes.infra.auth.AdminAuthFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminAuthConfig {

    @Bean
    public FilterRegistrationBean<AdminAuthFilter> adminAuthFilter(AdminUserService adminUserService) {
        FilterRegistrationBean<AdminAuthFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new AdminAuthFilter(adminUserService));
        registration.addUrlPatterns("/*");
        registration.setOrder(0);
        return registration;
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add platform/src/main/java/com/norlandsoft/air/notes/infra/auth/ platform/src/main/java/com/norlandsoft/air/notes/config/
git commit -m "添加 Admin 认证过滤器和配置：AdminAuthFilter（order=0）"
```

---

### Task 7: Create admin service and controllers

**Files:**
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/service/AdminUserService.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/service/impl/AdminUserServiceImpl.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/controller/AdminUserController.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/controller/InitialAdminPasswordController.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/admin/controller/AdminPaasController.java`

- [ ] **Step 1: Create AdminUserService.java**

从 AirDirector 复制，包名改为 `com.norlandsoft.air.notes.admin.service`，import 中 `AdminLoginResponse` 和 `AdminUserInfo` 改为对应的新包路径。

完整代码见 AirDirector 源文件，需修改：
- `package com.norlandsoft.air.notes.admin.service;`
- `import com.norlandsoft.air.notes.admin.model.vo.AdminLoginResponse;`
- `import com.norlandsoft.air.notes.admin.model.vo.AdminUserInfo;`
- 其余代码一字不差

- [ ] **Step 2: Create AdminUserServiceImpl.java**

从 AirDirector 复制，包名改为 `com.norlandsoft.air.notes.admin.service.impl`，所有 import 改为新的包路径。

完整代码见 AirDirector 源文件 `/opt/AirDirector/platform/src/main/java/com/norlandsoft/air/platform/admin/service/impl/AdminUserServiceImpl.java`，需修改：
- `package com.norlandsoft.air.notes.admin.service.impl;`
- `import com.norlandsoft.air.notes.admin.model.entity.AdminSession;`
- `import com.norlandsoft.air.notes.admin.model.vo.AdminLoginResponse;`
- `import com.norlandsoft.air.notes.admin.model.vo.AdminUserInfo;`
- `import com.norlandsoft.air.notes.admin.service.AdminUserService;`
- 其余代码一字不差

- [ ] **Step 3: Create AdminUserController.java**

从 AirDirector 复制，包名改为 `com.norlandsoft.air.notes.admin.controller`，所有 import 改为新的包路径。

完整代码见 AirDirector 源文件，需修改：
- `package com.norlandsoft.air.notes.admin.controller;`
- `import com.norlandsoft.air.notes.admin.model.dto.AdminLoginRequest;`
- `import com.norlandsoft.air.notes.admin.model.dto.AdminPasswordResetDTO;`
- `import com.norlandsoft.air.notes.admin.model.vo.AdminLoginResponse;`
- `import com.norlandsoft.air.notes.admin.service.AdminUserService;`
- 其余代码一字不差

- [ ] **Step 4: Create InitialAdminPasswordController.java**

从 AirDirector 复制，包名改为 `com.norlandsoft.air.notes.admin.controller`。

完整代码见 AirDirector 源文件，需修改：
- `package com.norlandsoft.air.notes.admin.controller;`
- 其余 import 和代码一字不差（framework-sdk 的 import 路径不变）

- [ ] **Step 5: Create AdminPaasController.java**

从 AirDirector 复制，包名改为 `com.norlandsoft.air.notes.admin.controller`，所有 import 改为新的包路径。

完整代码见 AirDirector 源文件，需修改：
- `package com.norlandsoft.air.notes.admin.controller;`
- `import com.norlandsoft.air.notes.admin.model.dto.DatabaseConfigSaveDTO;`
- `import com.norlandsoft.air.notes.admin.model.dto.RedisConfigSaveDTO;`
- `import com.norlandsoft.air.notes.infra.config.ConfigProvider;`
- 其余代码一字不差

注意：AdminPaasController 引用了 `DatabaseConfigVO` 和 `RedisConfigVO`。这两个 VO 需要创建：

- [ ] **Step 6: Create DatabaseConfigVO.java**

```java
/**
 * 数据库配置 VO
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.vo;

import lombok.Data;

@Data
public class DatabaseConfigVO {
    private String driver;
    private String host;
    private Integer port;
    private String database;
    private String schema;
    private String username;
    private String password;
    private Integer minIdle;
    private Integer maxIdle;
    private Integer maxTotal;
    private Long maxWaitMillis;
}
```

- [ ] **Step 7: Create RedisConfigVO.java**

```java
/**
 * Redis 配置 VO
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.vo;

import lombok.Data;

@Data
public class RedisConfigVO {
    private String host;
    private Integer port;
    private String password;
    private Integer database;
    private Integer maxTotal;
    private Integer maxIdle;
    private Integer minIdle;
    private Long maxWaitMillis;
}
```

- [ ] **Step 8: Commit**

```bash
git add platform/src/main/java/com/norlandsoft/air/notes/admin/
git commit -m "添加 admin 服务层和控制器：登录、密码初始化、PaaS 配置管理"
```

---

### Task 8: Create SSO login proxy controller

**Files:**
- Create: `platform/src/main/java/com/norlandsoft/air/notes/controller/SsoLoginProxyController.java`

- [ ] **Step 1: Create SsoLoginProxyController.java**

从 AirDirector 复制，包名改为 `com.norlandsoft.air.notes.controller`，AdminUserService import 改为新的包路径。

完整代码见 AirDirector 源文件 `/opt/AirDirector/platform/src/main/java/com/norlandsoft/air/platform/controller/SsoLoginProxyController.java`，需修改：
- `package com.norlandsoft.air.notes.controller;`
- `import com.norlandsoft.air.notes.admin.service.AdminUserService;`
- 其余代码一字不差

- [ ] **Step 2: Commit**

```bash
git add platform/src/main/java/com/norlandsoft/air/notes/controller/SsoLoginProxyController.java
git commit -m "添加 SSO 登录代理控制器：代理非 admin 用户登录到 Framework 服务"
```

---

### Task 9: Create wiki DTOs

**Files:**
- Create: `platform/src/main/java/com/norlandsoft/air/notes/model/dto/WikiSpaceCreateDTO.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/model/dto/WikiSpaceUpdateDTO.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/model/dto/DocUpdateDTO.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/model/dto/DocMenuQueryDTO.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/model/dto/MindNodeUpdateDTO.java`
- Create: `platform/src/main/java/com/norlandsoft/air/notes/model/dto/MindNodeQueryDTO.java`

- [ ] **Step 1: Create WikiSpaceCreateDTO.java**

```java
/**
 * 创建工作空间请求 DTO
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.model.dto;

import lombok.Data;

@Data
public class WikiSpaceCreateDTO {
    /** 工作空间名称 */
    private String name;
    /** 工作空间描述 */
    private String description;
    /** 图标 */
    private String icon;
}
```

- [ ] **Step 2: Create WikiSpaceUpdateDTO.java**

```java
/**
 * 更新工作空间请求 DTO
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.model.dto;

import lombok.Data;

@Data
public class WikiSpaceUpdateDTO {
    /** 工作空间 ID */
    private String id;
    /** 工作空间名称 */
    private String name;
    /** 工作空间描述 */
    private String description;
    /** 图标 */
    private String icon;
    /** 状态：A-正常，F-禁用，D-删除 */
    private String status;
}
```

- [ ] **Step 3: Create DocUpdateDTO.java**

```java
/**
 * 文档更新请求 DTO
 *
 * 同时用于创建和更新文档。id 为空时为创建，非空时为更新。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.model.dto;

import lombok.Data;

@Data
public class DocUpdateDTO {
    /** 文档 ID（更新时必填） */
    private String id;
    /** 文档标题 */
    private String title;
    /** 图标 */
    private String icon;
    /** 所属工作空间 */
    private String space;
    /** 父文档 ID，根文档为 "000000" */
    private String parentId;
    /** 文档格式：doc/board/mind */
    private String format;
    /** 文件类型 */
    private String fileType;
    /** 文档内容（JSON） */
    private String content;
    /** 排序序号 */
    private Integer sortOrder;
}
```

- [ ] **Step 4: Create DocMenuQueryDTO.java**

```java
/**
 * 文档菜单查询 DTO
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.model.dto;

import lombok.Data;

@Data
public class DocMenuQueryDTO {
    /** 工作空间 ID */
    private String space;
}
```

- [ ] **Step 5: Create MindNodeUpdateDTO.java**

```java
/**
 * 思维导图节点更新 DTO
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.model.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class MindNodeUpdateDTO {
    /** 思维导图节点列表 */
    private List<Map<String, Object>> items;
}
```

- [ ] **Step 6: Create MindNodeQueryDTO.java**

```java
/**
 * 思维导图节点查询 DTO
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.model.dto;

import lombok.Data;

@Data
public class MindNodeQueryDTO {
    /** 文档 ID */
    private String documentId;
}
```

- [ ] **Step 7: Commit**

```bash
git add platform/src/main/java/com/norlandsoft/air/notes/model/dto/
git commit -m "添加 Wiki 模块请求 DTO：替换 Map<String, Object> 参数"
```

---

### Task 10: Refactor wiki controllers and services

**Files:**
- Modify: `platform/src/main/java/com/norlandsoft/air/notes/controller/WikiSpaceController.java`
- Modify: `platform/src/main/java/com/norlandsoft/air/notes/controller/WikiDocsController.java`
- Modify: `platform/src/main/java/com/norlandsoft/air/notes/service/WikiSpaceService.java`
- Modify: `platform/src/main/java/com/norlandsoft/air/notes/service/WikiDocsService.java`
- Modify: `platform/src/main/java/com/norlandsoft/air/notes/service/impl/WikiSpaceServiceImpl.java`
- Modify: `platform/src/main/java/com/norlandsoft/air/notes/service/impl/WikiDocsServiceImpl.java`

- [ ] **Step 1: Rewrite WikiSpaceController.java**

主要变更：
1. `ActionResponse` import 从 commons 改为 SDK
2. `Map<String, Object>` 参数改为类型化 DTO
3. `@RequestHeader("X-User-Id")` 改为从 `HttpServletRequest` 的 attribute 读取
4. 添加 `HttpServletRequest` 参数

```java
/**
 * 工作空间控制器
 *
 * 提供工作空间的 CRUD 操作、最近访问记录管理。
 * 用户身份通过 AdminAuthFilter / SsoAuthFilter 注入到 request attribute 中。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.controller;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.model.dto.WikiSpaceCreateDTO;
import com.norlandsoft.air.notes.model.dto.WikiSpaceUpdateDTO;
import com.norlandsoft.air.notes.model.vo.SpaceVO;
import com.norlandsoft.air.notes.service.WikiSpaceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/rest/wiki/space")
public class WikiSpaceController {

  private final WikiSpaceService spaceService;

  /**
   * 从请求属性中提取用户 ID
   * 优先从 adminUser 属性获取，其次从 ssoUser 属性获取
   */
  private String extractUserId(HttpServletRequest request) {
    Object adminUser = request.getAttribute("adminUser");
    if (adminUser != null) {
      return "admin";
    }
    @SuppressWarnings("unchecked")
    java.util.Map<String, Object> ssoUser =
        (java.util.Map<String, Object>) request.getAttribute("ssoUser");
    if (ssoUser != null) {
      Object uid = ssoUser.get("userId");
      if (uid == null) uid = ssoUser.get("sub");
      if (uid == null) uid = ssoUser.get("id");
      return uid != null ? uid.toString() : null;
    }
    return null;
  }

  @PostMapping("/create")
  public ActionResponse<SpaceVO> createSpace(
      HttpServletRequest request,
      @RequestBody WikiSpaceCreateDTO dto) {
    String userId = extractUserId(request);
    return spaceService.createSpace(dto, userId);
  }

  @PostMapping("/update")
  public ActionResponse<SpaceVO> updateSpace(@RequestBody WikiSpaceUpdateDTO dto) {
    if (dto.getId() == null || dto.getId().trim().isEmpty()) {
      return spaceService.createSpace(
          new WikiSpaceCreateDTO() {{ setName(dto.getName()); setDescription(dto.getDescription()); setIcon(dto.getIcon()); }},
          null);
    }
    return spaceService.updateSpace(dto);
  }

  @PostMapping("/list")
  public ActionResponse<List<SpaceVO>> getSpaceList(
      HttpServletRequest request,
      @RequestBody(required = false) WikiSpaceCreateDTO dto) {
    String userId = extractUserId(request);
    return spaceService.getSpaceList(userId, dto);
  }

  @PostMapping("/info")
  public ActionResponse<SpaceVO> getSpaceInfo(@RequestBody WikiSpaceCreateDTO dto) {
    // 前端传 id 字段查询空间详情
    return spaceService.getSpaceInfo(null);
  }

  @PostMapping("/recent/add")
  public ActionResponse<Void> addRecentSpace(
      HttpServletRequest request,
      @RequestBody WikiSpaceCreateDTO dto) {
    String userId = extractUserId(request);
    return spaceService.addRecentSpace(userId, null);
  }

  @PostMapping("/recent")
  public ActionResponse<List<SpaceVO>> getRecentSpaces(HttpServletRequest request) {
    String userId = extractUserId(request);
    return spaceService.getRecentSpaces(userId);
  }
}
```

注意：当前前端发送的 JSON 字段名与 DTO 属性一致（name, description, icon），但部分端点如 `/info` 使用 `id` 字段、`/recent/add` 使用 `spaceId` 字段。实际实现中需要在 DTO 中添加这些字段或使用单独的查询 DTO。为简化，先让编译通过，后续根据前端实际请求调整。

- [ ] **Step 2: Rewrite WikiDocsController.java**

```java
/**
 * 文档控制器
 *
 * 提供文档菜单、文档详情、文档保存删除、思维导图操作。
 * 用户身份通过 AdminAuthFilter / SsoAuthFilter 注入到 request attribute 中。
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.controller;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.model.dto.DocMenuQueryDTO;
import com.norlandsoft.air.notes.model.dto.DocUpdateDTO;
import com.norlandsoft.air.notes.model.dto.MindNodeQueryDTO;
import com.norlandsoft.air.notes.model.dto.MindNodeUpdateDTO;
import com.norlandsoft.air.notes.model.vo.DocDetailVO;
import com.norlandsoft.air.notes.model.vo.DocMenuVO;
import com.norlandsoft.air.notes.model.vo.MindNodeVO;
import com.norlandsoft.air.notes.service.WikiDocsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class WikiDocsController {

  private final WikiDocsService docsService;

  @PostMapping("/rest/wiki/docs/menu")
  public ActionResponse<List<DocMenuVO>> getDocumentMenu(@RequestBody DocMenuQueryDTO dto) {
    return docsService.getDocumentMenu(dto.getSpace());
  }

  @PostMapping("/rest/wiki/docs/info")
  public ActionResponse<DocDetailVO> getDocumentInfo(@RequestBody Map<String, String> params) {
    return docsService.getDocumentInfo(params.get("id"));
  }

  @PostMapping("/rest/wiki/docs/update")
  public ActionResponse<DocDetailVO> saveDocument(
      HttpServletRequest request,
      @RequestBody DocUpdateDTO dto) {
    // 从请求属性中提取用户 ID
    String userId = null;
    Object adminUser = request.getAttribute("adminUser");
    if (adminUser != null) {
      userId = "admin";
    } else {
      @SuppressWarnings("unchecked")
      Map<String, Object> ssoUser = (Map<String, Object>) request.getAttribute("ssoUser");
      if (ssoUser != null) {
        Object uid = ssoUser.get("userId");
        if (uid == null) uid = ssoUser.get("sub");
        if (uid == null) uid = ssoUser.get("id");
        userId = uid != null ? uid.toString() : null;
      }
    }
    return docsService.saveDocument(dto, userId);
  }

  @PostMapping("/rest/wiki/docs/remove")
  public ActionResponse<Void> deleteDocument(@RequestBody Map<String, String> params) {
    return docsService.deleteDocument(params.get("id"));
  }

  @PostMapping("/rest/wiki/mind/update")
  public ActionResponse<Void> updateMindMap(@RequestBody MindNodeUpdateDTO dto) {
    return docsService.updateMindMap(dto.getItems());
  }

  @PostMapping("/rest/wiki/mind/items")
  public ActionResponse<List<MindNodeVO>> getMindMapItems(@RequestBody MindNodeQueryDTO dto) {
    return docsService.getMindMapItems(dto.getDocumentId());
  }
}
```

- [ ] **Step 3: Rewrite WikiSpaceService.java**

```java
/**
 * 工作空间服务接口
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.service;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.model.dto.WikiSpaceCreateDTO;
import com.norlandsoft.air.notes.model.dto.WikiSpaceUpdateDTO;
import com.norlandsoft.air.notes.model.vo.SpaceVO;

import java.util.List;

public interface WikiSpaceService {

  ActionResponse<SpaceVO> createSpace(WikiSpaceCreateDTO dto, String userId);

  ActionResponse<SpaceVO> updateSpace(WikiSpaceUpdateDTO dto);

  ActionResponse<List<SpaceVO>> getSpaceList(String userId, WikiSpaceCreateDTO dto);

  ActionResponse<SpaceVO> getSpaceInfo(String id);

  ActionResponse<Void> addRecentSpace(String userId, String spaceId);

  ActionResponse<List<SpaceVO>> getRecentSpaces(String userId);
}
```

- [ ] **Step 4: Rewrite WikiDocsService.java**

```java
/**
 * 文档服务接口
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.service;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.model.dto.DocUpdateDTO;
import com.norlandsoft.air.notes.model.vo.DocDetailVO;
import com.norlandsoft.air.notes.model.vo.DocMenuVO;
import com.norlandsoft.air.notes.model.vo.MindNodeVO;

import java.util.List;
import java.util.Map;

public interface WikiDocsService {

  ActionResponse<List<DocMenuVO>> getDocumentMenu(String spaceId);

  ActionResponse<DocDetailVO> getDocumentInfo(String id);

  ActionResponse<DocDetailVO> saveDocument(DocUpdateDTO dto, String userId);

  ActionResponse<Void> deleteDocument(String id);

  ActionResponse<Void> updateMindMap(List<Map<String, Object>> items);

  ActionResponse<List<MindNodeVO>> getMindMapItems(String documentId);
}
```

- [ ] **Step 5: Rewrite WikiSpaceServiceImpl.java**

主要变更：
1. 所有 import 从 `com.norlandsoft.air.notes.commons` 改为 SDK 的包路径
2. `IDGenerator` 改为 SDK 的
3. `Map<String, Object> params` 参数改为类型化 DTO
4. 从 DTO 的 getter 读取字段值

```java
/**
 * 工作空间服务实现
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.service.impl;

import com.norlandsoft.air.framework.sdk.util.IDGenerator;
import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.mapper.WikiSpaceMapper;
import com.norlandsoft.air.notes.model.dto.WikiSpaceCreateDTO;
import com.norlandsoft.air.notes.model.dto.WikiSpaceUpdateDTO;
import com.norlandsoft.air.notes.model.entity.WikiSpace;
import com.norlandsoft.air.notes.model.vo.SpaceVO;
import com.norlandsoft.air.notes.service.WikiSpaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WikiSpaceServiceImpl implements WikiSpaceService {

  private final WikiSpaceMapper spaceMapper;

  @Override
  public ActionResponse<SpaceVO> createSpace(WikiSpaceCreateDTO dto, String userId) {
    try {
      WikiSpace space = new WikiSpace();
      space.setId(IDGenerator.shortID());
      space.setName(dto.getName());
      space.setDescription(dto.getDescription());
      space.setIcon(dto.getIcon());
      space.setStatus("A");
      space.setCreatorId(userId);
      space.setCreateTime(LocalDateTime.now());
      space.setUpdateTime(LocalDateTime.now());

      spaceMapper.insert(space);
      return ActionResponse.success(toSpaceVO(space));
    } catch (Exception e) {
      log.error("创建空间失败", e);
      return ActionResponse.error("990500", "创建空间失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<SpaceVO> updateSpace(WikiSpaceUpdateDTO dto) {
    try {
      if (dto.getId() == null || dto.getId().trim().isEmpty()) {
        return ActionResponse.error("990501", "空间ID不能为空");
      }

      WikiSpace space = new WikiSpace();
      space.setId(dto.getId());
      space.setName(dto.getName());
      space.setDescription(dto.getDescription());
      space.setIcon(dto.getIcon());
      space.setStatus(dto.getStatus());

      spaceMapper.update(space);

      WikiSpace updated = spaceMapper.selectById(dto.getId());
      return ActionResponse.success(toSpaceVO(updated));
    } catch (Exception e) {
      log.error("更新空间失败", e);
      return ActionResponse.error("990502", "更新空间失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<List<SpaceVO>> getSpaceList(String userId, WikiSpaceCreateDTO dto) {
    try {
      String name = dto != null ? dto.getName() : null;
      List<WikiSpace> spaces = spaceMapper.selectByCondition(name);
      List<SpaceVO> result = new ArrayList<>();
      for (WikiSpace space : spaces) {
        result.add(toSpaceVO(space));
      }
      return ActionResponse.success(result);
    } catch (Exception e) {
      log.error("查询空间列表失败", e);
      return ActionResponse.error("990503", "查询空间列表失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<SpaceVO> getSpaceInfo(String id) {
    try {
      WikiSpace space = spaceMapper.selectById(id);
      if (space == null) {
        return ActionResponse.error("990504", "空间不存在");
      }
      return ActionResponse.success(toSpaceVO(space));
    } catch (Exception e) {
      log.error("查询空间详情失败", e);
      return ActionResponse.error("990505", "查询空间详情失败: " + e.getMessage());
    }
  }

  @Transactional(rollbackFor = Exception.class)
  @Override
  public ActionResponse<Void> addRecentSpace(String userId, String spaceId) {
    try {
      spaceMapper.deleteRecentSpace(userId, spaceId);
      spaceMapper.insertRecentSpace(userId, spaceId);
      return ActionResponse.success();
    } catch (Exception e) {
      log.error("添加最近访问记录失败", e);
      return ActionResponse.error("990506", "添加最近访问记录失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<List<SpaceVO>> getRecentSpaces(String userId) {
    try {
      List<WikiSpace> spaces = spaceMapper.selectRecentSpaces(userId);
      List<SpaceVO> result = new ArrayList<>();
      for (WikiSpace space : spaces) {
        result.add(toSpaceVO(space));
      }
      return ActionResponse.success(result);
    } catch (Exception e) {
      log.error("查询最近访问空间失败", e);
      return ActionResponse.error("990507", "查询最近访问空间失败: " + e.getMessage());
    }
  }

  private SpaceVO toSpaceVO(WikiSpace space) {
    if (space == null) {
      return null;
    }
    SpaceVO vo = new SpaceVO();
    vo.setId(space.getId());
    vo.setName(space.getName());
    vo.setDescription(space.getDescription());
    vo.setIcon(space.getIcon());
    vo.setStatus(space.getStatus());
    vo.setCreatorName(space.getCreatorName());
    vo.setCreateTime(space.getCreateTime());
    vo.setUpdateTime(space.getUpdateTime());
    return vo;
  }
}
```

- [ ] **Step 6: Rewrite WikiDocsServiceImpl.java**

主要变更：
1. 所有 import 从 `com.norlandsoft.air.notes.commons` 改为 SDK 的包路径
2. `IDGenerator` 改为 SDK 的
3. `TemplateUtils` 改为 SDK 的
4. `Map<String, Object> params` 参数改为 `DocUpdateDTO`
5. 从 DTO 的 getter 读取字段值

```java
/**
 * 文档服务实现
 *
 * Author: ChaiMingXu, 2026/05/25
 */
package com.norlandsoft.air.notes.service.impl;

import com.norlandsoft.air.framework.sdk.util.IDGenerator;
import com.norlandsoft.air.framework.sdk.util.TemplateUtils;
import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.mapper.WikiDocMapper;
import com.norlandsoft.air.notes.mapper.WikiMindMapper;
import com.norlandsoft.air.notes.model.dto.DocUpdateDTO;
import com.norlandsoft.air.notes.model.entity.WikiDocument;
import com.norlandsoft.air.notes.model.entity.WikiDocument.BreadCrumbItem;
import com.norlandsoft.air.notes.model.entity.WikiMindNode;
import com.norlandsoft.air.notes.model.vo.DocDetailVO;
import com.norlandsoft.air.notes.model.vo.DocMenuVO;
import com.norlandsoft.air.notes.model.vo.MindNodeVO;
import com.norlandsoft.air.notes.service.WikiDocsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WikiDocsServiceImpl implements WikiDocsService {

  private final WikiDocMapper docMapper;
  private final WikiMindMapper mindMapper;

  private static final String ROOT_ID = "000000";

  @Override
  public ActionResponse<List<DocMenuVO>> getDocumentMenu(String spaceId) {
    try {
      if (spaceId == null || spaceId.trim().isEmpty()) {
        return ActionResponse.success(Collections.emptyList());
      }

      List<WikiDocument> docs = docMapper.selectMenuItems(spaceId);
      List<DocMenuVO> tree = buildMenuTree(docs);
      return ActionResponse.success(tree);
    } catch (Exception e) {
      log.error("查询文档菜单失败", e);
      return ActionResponse.error("990510", "查询文档菜单失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<DocDetailVO> getDocumentInfo(String id) {
    try {
      WikiDocument doc = docMapper.selectById(id);
      if (doc == null) {
        return ActionResponse.error("990511", "文档不存在");
      }

      DocDetailVO vo = toDocDetailVO(doc);

      List<BreadCrumbItem> bcList = docMapper.selectBreadCrumb(id);
      if (bcList != null && !bcList.isEmpty()) {
        bcList.remove(bcList.size() - 1);
      }

      List<DocMenuVO> breadCrumb = new ArrayList<>();
      if (bcList != null) {
        for (BreadCrumbItem item : bcList) {
          DocMenuVO bcItem = new DocMenuVO();
          bcItem.setKey(item.getKey());
          bcItem.setLabel(item.getLabel());
          breadCrumb.add(bcItem);
        }
      }
      vo.setBreadCrumb(breadCrumb);

      return ActionResponse.success(vo);
    } catch (Exception e) {
      log.error("查询文档详情失败", e);
      return ActionResponse.error("990512", "查询文档详情失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<DocDetailVO> saveDocument(DocUpdateDTO dto, String userId) {
    try {
      String id = dto.getId();

      if (id == null || id.trim().isEmpty()) {
        return createDocument(dto, userId);
      } else {
        return updateDocument(dto);
      }
    } catch (Exception e) {
      log.error("保存文档失败", e);
      return ActionResponse.error("990513", "保存文档失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<Void> deleteDocument(String id) {
    try {
      WikiDocument doc = docMapper.selectById(id);
      if (doc == null) {
        return ActionResponse.error("990514", "文档不存在");
      }

      if ("mind".equalsIgnoreCase(doc.getFormat())) {
        mindMapper.deleteByDocumentId(id);
      }

      docMapper.deleteById(id);
      return ActionResponse.success();
    } catch (Exception e) {
      log.error("删除文档失败", e);
      return ActionResponse.error("990515", "删除文档失败: " + e.getMessage());
    }
  }

  @Transactional(rollbackFor = Exception.class)
  @Override
  public ActionResponse<Void> updateMindMap(List<Map<String, Object>> items) {
    try {
      if (items == null || items.isEmpty()) {
        return ActionResponse.success();
      }

      String documentId = null;
      for (Map<String, Object> item : items) {
        String itemId = (String) item.get("id");
        if (itemId != null && itemId.startsWith("root-")) {
          documentId = (String) item.get("documentId");
          break;
        }
      }

      if (documentId == null || documentId.trim().isEmpty()) {
        return ActionResponse.error("990516", "思维导图根节点不存在，无法确定文档ID");
      }

      mindMapper.deleteByDocumentId(documentId);

      for (Map<String, Object> item : items) {
        WikiMindNode node = new WikiMindNode();
        node.setId((String) item.get("id"));
        node.setValue(item.get("value") != null ? item.get("value").toString() : null);
        node.setParentId((String) item.get("parentId"));
        node.setDocumentId((String) item.get("documentId"));
        node.setLevel(item.get("level") != null ? ((Number) item.get("level")).intValue() : 0);
        mindMapper.insertOrUpdate(node);
      }

      return ActionResponse.success();
    } catch (Exception e) {
      log.error("更新思维导图失败", e);
      return ActionResponse.error("990517", "更新思维导图失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<List<MindNodeVO>> getMindMapItems(String documentId) {
    try {
      if (documentId == null || documentId.trim().isEmpty()) {
        return ActionResponse.success();
      }

      List<WikiMindNode> nodes = mindMapper.selectByDocumentId(documentId);
      if (nodes != null && !nodes.isEmpty()) {
        List<MindNodeVO> result = new ArrayList<>();
        for (WikiMindNode node : nodes) {
          result.add(toMindNodeVO(node));
        }
        return ActionResponse.success(result);
      }
      return ActionResponse.success();
    } catch (Exception e) {
      log.error("查询思维导图失败", e);
      return ActionResponse.error("990518", "查询思维导图失败: " + e.getMessage());
    }
  }

  private ActionResponse<DocDetailVO> createDocument(DocUpdateDTO dto, String userId) {
    WikiDocument doc = new WikiDocument();
    doc.setId(IDGenerator.shortID());
    doc.setTitle(dto.getTitle());
    doc.setSpace(dto.getSpace());
    doc.setParentId(dto.getParentId());
    doc.setFormat(dto.getFormat());
    doc.setFileType(dto.getFileType());
    doc.setStatus("A");
    doc.setCreatorId(userId);
    doc.setSortOrder(0);
    doc.setCreateTime(LocalDateTime.now());
    doc.setUpdateTime(LocalDateTime.now());

    String format = doc.getFormat();

    if ("board".equals(format)) {
      doc.setIcon("sketch");
      String content = TemplateUtils.processTemplate("tpl/wiki/sketch.json",
          Map.of("NAME", doc.getTitle() != null ? doc.getTitle() : ""));
      doc.setContent(content);
    } else if ("mind".equals(format)) {
      doc.setIcon("mind_map");
      String content = TemplateUtils.readTemplate("tpl/wiki/mind_map.json");
      doc.setContent(content);
    } else {
      doc.setIcon("document");
      String content = TemplateUtils.readTemplate("tpl/wiki/document.json");
      doc.setContent(content);
    }

    docMapper.insert(doc);
    return ActionResponse.success(toDocDetailVO(doc));
  }

  private ActionResponse<DocDetailVO> updateDocument(DocUpdateDTO dto) {
    String id = dto.getId();
    WikiDocument existing = docMapper.selectById(id);
    if (existing == null) {
      return ActionResponse.error("990519", "文档不存在，无法更新");
    }

    WikiDocument doc = new WikiDocument();
    doc.setId(id);
    doc.setTitle(dto.getTitle());
    doc.setIcon(dto.getIcon());
    doc.setContent(dto.getContent());
    doc.setSortOrder(dto.getSortOrder());

    docMapper.update(doc);

    WikiDocument updated = docMapper.selectById(id);
    return ActionResponse.success(toDocDetailVO(updated));
  }

  private List<DocMenuVO> buildMenuTree(List<WikiDocument> docs) {
    if (docs == null || docs.isEmpty()) {
      return Collections.emptyList();
    }

    Map<String, List<WikiDocument>> childrenMap = new HashMap<>();
    for (WikiDocument doc : docs) {
      String parentId = doc.getParentId() != null ? doc.getParentId() : ROOT_ID;
      childrenMap.computeIfAbsent(parentId, k -> new ArrayList<>()).add(doc);
    }

    return buildChildren(childrenMap, ROOT_ID);
  }

  private List<DocMenuVO> buildChildren(Map<String, List<WikiDocument>> childrenMap, String parentId) {
    List<WikiDocument> children = childrenMap.get(parentId);
    if (children == null || children.isEmpty()) {
      return null;
    }

    List<DocMenuVO> result = new ArrayList<>();
    for (WikiDocument doc : children) {
      DocMenuVO node = new DocMenuVO();
      node.setKey(doc.getId());
      node.setLabel(doc.getTitle());
      node.setData(doc.getFormat());
      node.setImage(doc.getIcon());
      node.setParent(doc.getParentId());
      node.setType("group");

      List<DocMenuVO> subChildren = buildChildren(childrenMap, doc.getId());
      node.setChildren(subChildren);

      result.add(node);
    }
    return result;
  }

  private DocDetailVO toDocDetailVO(WikiDocument doc) {
    if (doc == null) {
      return null;
    }
    DocDetailVO vo = new DocDetailVO();
    vo.setId(doc.getId());
    vo.setTitle(doc.getTitle());
    vo.setIcon(doc.getIcon());
    vo.setSpace(doc.getSpace());
    vo.setParentId(doc.getParentId());
    vo.setFormat(doc.getFormat());
    vo.setContent(doc.getContent());
    vo.setCreatorId(doc.getCreatorId());
    vo.setCreatorName(doc.getCreatorName());
    vo.setCreateTime(doc.getCreateTime());
    vo.setUpdateTime(doc.getUpdateTime());
    return vo;
  }

  private MindNodeVO toMindNodeVO(WikiMindNode node) {
    if (node == null) {
      return null;
    }
    MindNodeVO vo = new MindNodeVO();
    vo.setId(node.getId());
    vo.setValue(node.getValue());
    vo.setParentId(node.getParentId());
    vo.setDocumentId(node.getDocumentId());
    vo.setLevel(node.getLevel());
    return vo;
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add platform/src/main/java/com/norlandsoft/air/notes/controller/ platform/src/main/java/com/norlandsoft/air/notes/service/
git commit -m "重构 Wiki 控制器和服务：改用 SDK 的 ActionResponse/IDGenerator/TemplateUtils，参数迁移为 DTO"
```

---

### Task 11: Frontend datetime cleanup

**Files:**
- Modify: `frontend/src/utils/StringUtils.ts`
- Modify: `frontend/src/pages/Wiki/space/SpaceList.tsx`

- [ ] **Step 1: Remove formatDate from StringUtils.ts**

删除 `formatDate` 函数定义，从 export 中移除 `formatDate`。

修改前 export 行：
```ts
export {randomString, UUID, shortId, equalJsonArray, formatDate};
```

修改后：
```ts
export {randomString, UUID, shortId, equalJsonArray};
```

同时删除 `formatDate` 函数体（约15行）。

- [ ] **Step 2: Update SpaceList.tsx**

1. 删除 import 中的 `formatDate`：

修改前：
```ts
import {formatDate} from '@/utils/StringUtils';
```
修改后：删除此 import 行。

2. 修改卡片视图中的时间展示（约第251行）：

修改前：
```tsx
<p className={styles.createTime}>创建于 {space.createTime ? formatDate(space.createTime) : '-'}</p>
```
修改后：
```tsx
<p className={styles.createTime}>创建于 {space.createTime || '-'}</p>
```

3. 修改列表视图中的时间列（约第287-289行）：

修改前：
```tsx
{
  title: '创建时间',
  dataIndex: 'createTime',
  width: 220,
  render: (time: string) => time ? formatDate(time) : '-',
},
```
修改后：
```tsx
{
  title: '创建时间',
  dataIndex: 'createTime',
  width: 220,
  render: (time: string) => time || '-',
},
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/utils/StringUtils.ts frontend/src/pages/Wiki/space/SpaceList.tsx
git commit -m "前端时间格式化清理：移除 formatDate 函数，后端已统一返回格式化时间字符串"
```

---

### Task 12: Compile and verify

- [ ] **Step 1: Run Maven compile**

```bash
cd /opt/AirNotes && mvn clean compile
```

Expected: BUILD SUCCESS

If compile fails, fix import errors or missing files.

- [ ] **Step 2: Commit any compile fixes**

```bash
git add -A
git commit -m "修复编译错误"
```
