# AirNotes Backend Overhaul Design

## Goal

Restructure AirNotes backend to match AirDirector's architecture: replace hand-rolled utilities with `framework-sdk:1.0.0`, introduce dual-tier authentication (admin local + SSO via framework), adopt DynamicDataSource/Redis, migrate controllers to typed DTOs, and unify datetime serialization.

## Decisions

| Decision | Choice |
|---|---|
| Database config | DynamicDataSource (runtime PaaS admin UI) |
| Redis | Include DynamicRedisPool + admin PaaS UI |
| sys_user table | Drop entirely |
| framework-sdk version | 1.0.0 (same as AirDirector) |
| Controller parameters | Migrate to typed DTOs |
| Approach | Big-bang (single pass) |

## 1. POM Restructuring

### Parent POM (`pom.xml`)

- Keep `spring-boot-starter-parent:4.1.0-M4`
- Keep `air-framework-dependencies:1.2.0` BOM import
- Remove managed dependency declarations that framework-sdk provides

### Platform POM (`platform/pom.xml`)

Replace ALL dependencies with:

```xml
<dependency>
    <groupId>com.norlandsoft</groupId>
    <artifactId>framework-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

framework-sdk transitively provides: spring-boot-starter-web, spring-boot-starter-log4j2, spring-boot-starter-jdbc, commons-dbcp2, mybatis, mybatis-spring, postgresql, h2, jedis, jjwt-api/impl/jackson, httpclient5, hutool-all, commons-io, commons-lang3, jakarta.annotation-api, lombok.

Keep `spring-boot-maven-plugin` and resource config for MyBatis XML files.

## 2. Package Structure

```
com.norlandsoft.air
  AirNotes.java                              (main class)
  notes/
    config/
      AdminAuthConfig.java                   (registers AdminAuthFilter bean)
    infra/
      auth/
        AdminAuthFilter.java                 (admin JWT filter, order=0)
      config/
        ConfigEarlyBootstrap.java            (BeanFactoryPostProcessor, preloads H2 config)
        ConfigProvider.java                  (ConcurrentHashMap + watcher callbacks)
        DataSourceConfig.java                (DynamicDataSource as @Primary bean)
        DynamicDataSource.java               (DataSource proxy, hot-reconnect)
        DynamicRedisPool.java                (JedisPool wrapper, hot-reconnect)
        MyBatisConfig.java                   (SqlSessionFactory + @MapperScan)
        RedisPoolInitializer.java            (ApplicationRunner, bootstraps pool)
    admin/
      controller/
        AdminUserController.java             (/admin/user/login, /admin/user/changePassword)
        InitialAdminPasswordController.java  (GET /initialAdminPassword)
        AdminPaasController.java             (/admin/paas/database/*, /admin/paas/redis/*)
      service/
        AdminUserService.java                (interface)
        impl/AdminUserServiceImpl.java       (EmbeddedStorage-backed)
      model/
        dto/AdminLoginRequest.java
        dto/AdminPasswordResetDTO.java
        dto/DatabaseConfigSaveDTO.java
        dto/RedisConfigSaveDTO.java
        vo/AdminUserInfo.java
        vo/AdminLoginResponse.java
        entity/AdminSession.java
    controller/
      SsoLoginProxyController.java           (/rest/auth/login, current, logout)
      WikiSpaceController.java               (/rest/wiki/space/*)
      WikiDocsController.java                (/rest/wiki/docs/*, /rest/wiki/mind/*)
    service/
      WikiSpaceService.java                  (interface)
      impl/WikiSpaceServiceImpl.java
      WikiDocsService.java                   (interface)
      impl/WikiDocsServiceImpl.java
    mapper/
      WikiSpaceMapper.java + .xml
      WikiDocMapper.java + .xml
      WikiMindMapper.java + .xml
    model/
      entity/
        WikiSpace.java
        WikiDocument.java
        WikiMindNode.java
      vo/
        SpaceVO.java
        DocDetailVO.java
        DocMenuVO.java
        MindNodeVO.java
      dto/
        WikiSpaceCreateDTO.java
        WikiSpaceUpdateDTO.java
        DocUpdateDTO.java
        DocMenuQueryDTO.java
        MindNodeUpdateDTO.java
        MindNodeQueryDTO.java
```

### Files to delete

- `commons/ActionResponse.java` (use SDK's `ActionResponse`)
- `commons/JwtUtils.java` (use SDK's `SsoTokenService` + admin's own JWT logic)
- `commons/PasswordUtils.java` (use SDK's `CryptoUtils`)
- `utils/CryptoUtils.java` (use SDK's `CryptoUtils`)
- `utils/IDGenerator.java` (use SDK's `IDGenerator`)
- `utils/TemplateUtils.java` (use SDK's `com.norlandsoft.air.framework.sdk.util.TemplateUtils`)
- `model/entity/User.java`
- `mapper/UserMapper.java` + `UserMapper.xml`
- `controller/UserController.java`
- `service/UserService.java` + `service/impl/UserServiceImpl.java`
- `resources/db/schema_user.sql`

### Files to keep (unchanged or minimal edits)

- `model/entity/WikiSpace.java`, `WikiDocument.java`, `WikiMindNode.java`
- `model/vo/SpaceVO.java`, `DocDetailVO.java`, `DocMenuVO.java`, `MindNodeVO.java`
- `mapper/WikiSpaceMapper.java/.xml`, `WikiDocMapper.java/.xml`, `WikiMindMapper.java/.xml`
- `resources/tpl/wiki/*.json` (document templates)
- `resources/db/schema_wiki.sql`

## 3. Authentication Layer

### Filter chain

```
Request -> AdminAuthFilter (order=0) -> SsoAuthFilter (order=1, from SDK) -> Controller
```

### Admin tier

- `AdminAuthFilter` protects `/admin/**` except `/admin/user/login`
- Admin password initialized via `GET /initialAdminPassword` (one-time)
- Password stored SHA-256 hashed in `EmbeddedStorage` (H2)
- Session stored as `AdminSession` JSON in EmbeddedStorage with 2-hour sliding expiry
- JWT signed with service-specific HMAC-SHA secret
- Login: `POST /admin/user/login` with `{id: "admin", password: "<sha256>"}`

### SSO tier

- `SsoAuthFilter` (from framework-sdk) protects `/rest/**` except `/rest/auth/login`, `/rest/auth/current`
- Activated by `framework.address` property (env var `FRAMEWORK_ADDRESS` or JVM arg)
- If `request.getAttribute("adminUser") != null`, SsoAuthFilter skips
- SSO login proxied to framework service via `SsoLoginProxyController`
- Token validated locally, blacklist synced periodically

### User identity in controllers

Replace `@RequestHeader("X-User-Id") String userId` with reading request attributes:

```java
// Admin user
AdminUserInfo adminUser = (AdminUserInfo) request.getAttribute("adminUser");

// SSO user
@SuppressWarnings("unchecked")
Map<String, Object> ssoUser = (Map<String, Object>) request.getAttribute("ssoUser");
```

## 4. Infrastructure Layer

### DynamicDataSource + ConfigProvider

- `ConfigEarlyBootstrap` preloads database/Redis config from EmbeddedStorage
- `ConfigProvider` holds config in ConcurrentHashMap with watcher callbacks
- `DynamicDataSource` wraps real DataSource, hot-rebuilds on config change
- `DynamicRedisPool` wraps JedisPool, hot-rebuilds on config change
- `RedisPoolInitializer` bootstraps pool on startup

### Bootstrap flow

1. App starts with EmbeddedStorage (H2) only
2. Admin initializes password via `GET /initialAdminPassword`
3. Admin logs in and configures PostgreSQL + Redis via PaaS endpoints
4. DynamicDataSource/DynamicRedisPool connect on config save
5. Wiki tables created in PostgreSQL

### application.yml

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

Remove `spring.datasource.*` entirely (database config in EmbeddedStorage).

## 5. Controller/Service Refactor

### New controllers

| Controller | Endpoints | Purpose |
|---|---|---|
| `AdminUserController` | `POST /admin/user/login`, `POST /admin/user/changePassword` | Admin auth |
| `InitialAdminPasswordController` | `GET /initialAdminPassword` | One-time password init |
| `AdminPaasController` | `/admin/paas/database/*`, `/admin/paas/redis/*` | Runtime infra config |
| `SsoLoginProxyController` | `/rest/auth/login`, `/rest/auth/current`, `/rest/auth/logout` | SSO proxy |

### Modified controllers

| Controller | Changes |
|---|---|
| `WikiSpaceController` | Parameters `Map<String,Object>` -> typed DTOs. `X-User-Id` header -> request attributes |
| `WikiDocsController` | Same treatment |

### Service changes

- `WikiSpaceServiceImpl` / `WikiDocsServiceImpl`: Read user identity from `HttpServletRequest` attributes instead of header
- All `ActionResponse` imports changed from `com.norlandsoft.air.notes.commons.ActionResponse` to `com.norlandsoft.air.framework.sdk.web.ActionResponse`
- All `IDGenerator` imports changed from local to SDK

### DTOs to create

- `WikiSpaceCreateDTO` — name, description, icon
- `WikiSpaceUpdateDTO` — id, name, description, icon, status
- `DocUpdateDTO` — id, title, icon, content, format, parentId, sortOrder
- `DocMenuQueryDTO` — space
- `MindNodeUpdateDTO` — documentId, nodes (JSON)
- `MindNodeQueryDTO` — documentId
- `AdminLoginRequest` — id, password
- `AdminPasswordResetDTO` — oldPassword, newPassword
- `DatabaseConfigSaveDTO` — url, username, password, driverClassName
- `RedisConfigSaveDTO` — host, port, password

## 6. Datetime Unification

### Backend

All entities already use `LocalDateTime`, all DB columns already use `TIMESTAMP`. The gap:

- Add Jackson config to `application.yml` (covered in Section 4)
- Delete `schema_user.sql` (no sys_user table)

### Frontend

- Remove `formatDate()` from `frontend/src/utils/StringUtils.ts`
- In `frontend/src/pages/Wiki/space/SpaceList.tsx`: Replace `formatDate(space.createTime)` with direct use of `space.createTime` (backend now returns `"2026-05-25 14:30:00"` format strings)

## 7. Files Summary

### New files (copied from AirDirector, adapted for AirNotes)

- `config/AdminAuthConfig.java`
- `infra/auth/AdminAuthFilter.java`
- `infra/config/ConfigEarlyBootstrap.java`
- `infra/config/ConfigProvider.java`
- `infra/config/DataSourceConfig.java`
- `infra/config/DynamicDataSource.java`
- `infra/config/DynamicRedisPool.java`
- `infra/config/MyBatisConfig.java`
- `infra/config/RedisPoolInitializer.java`
- `admin/controller/AdminUserController.java`
- `admin/controller/InitialAdminPasswordController.java`
- `admin/controller/AdminPaasController.java`
- `admin/service/AdminUserService.java`
- `admin/service/impl/AdminUserServiceImpl.java`
- `admin/model/dto/AdminLoginRequest.java`
- `admin/model/dto/AdminPasswordResetDTO.java`
- `admin/model/dto/DatabaseConfigSaveDTO.java`
- `admin/model/dto/RedisConfigSaveDTO.java`
- `admin/model/vo/AdminUserInfo.java`
- `admin/model/vo/AdminLoginResponse.java`
- `admin/model/entity/AdminSession.java`
- `controller/SsoLoginProxyController.java`
- `model/dto/WikiSpaceCreateDTO.java`
- `model/dto/WikiSpaceUpdateDTO.java`
- `model/dto/DocUpdateDTO.java`
- `model/dto/DocMenuQueryDTO.java`
- `model/dto/MindNodeUpdateDTO.java`
- `model/dto/MindNodeQueryDTO.java`

### Modified files

- `pom.xml` (parent) — remove redundant managed deps
- `platform/pom.xml` — replace all deps with framework-sdk
- `AirNotes.java` (main class) — add workspace/log init
- `application.yml` — remove datasource, add Jackson config
- `controller/WikiSpaceController.java` — DTO params, identity from attributes
- `controller/WikiDocsController.java` — same
- `service/impl/WikiSpaceServiceImpl.java` — identity from request attributes
- `service/impl/WikiDocsServiceImpl.java` — same
- `frontend/src/utils/StringUtils.ts` — remove formatDate
- `frontend/src/pages/Wiki/space/SpaceList.tsx` — remove formatDate calls

### Deleted files

- `commons/ActionResponse.java`
- `commons/JwtUtils.java`
- `commons/PasswordUtils.java`
- `utils/CryptoUtils.java`
- `utils/IDGenerator.java`
- `utils/TemplateUtils.java`
- `model/entity/User.java`
- `mapper/UserMapper.java`
- `mapper/UserMapper.xml`
- `controller/UserController.java`
- `service/UserService.java`
- `service/impl/UserServiceImpl.java`
- `resources/db/schema_user.sql`
