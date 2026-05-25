package com.norlandsoft.air.notes.admin.service.impl;

import com.norlandsoft.air.notes.admin.model.entity.AdminSession;
import tools.jackson.databind.ObjectMapper;
import com.norlandsoft.air.notes.admin.model.vo.AdminLoginResponse;
import com.norlandsoft.air.notes.admin.model.vo.AdminUserInfo;
import com.norlandsoft.air.notes.admin.service.AdminUserService;
import com.norlandsoft.air.framework.sdk.storage.EmbeddedStorage;
import com.norlandsoft.air.framework.sdk.util.CryptoUtils;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * 管理员用户服务实现
 *
 * admin 密码与会话均存于 EmbeddedStorage（H2），不依赖 Redis。
 * 支持登录验证、密码初始化、Token验证（含滑动过期）。
 * 会话时间字段统一使用 LocalDateTime，Jackson 自动格式化。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@Service
public class AdminUserServiceImpl implements AdminUserService {

  private static final String ADMIN_USER_ID = "admin";
  private static final String ADMIN_PASSWORD_KEY = "admin.password";
  private static final String SESSION_GROUP = "admin_session";
  private static final String TOKEN_GROUP = "admin_token";
  private static final String TOKEN_KEY_ADMIN = "admin";
  private static final int SESSION_EXPIRE_SECONDS = 2 * 60 * 60;
  private static final long TOKEN_EXPIRE_MS = 2L * 60 * 60 * 1000;
  private static final String JWT_SECRET = "AirNotesSecretKeyForJWTSigning2025MustBeChangedInProduction";

  /** 使用 Spring 管理的 ObjectMapper，已配置 JavaTimeModule 支持 LocalDateTime 序列化 */
  @Autowired
  private ObjectMapper objectMapper;

  @Override
  public AdminLoginResponse login(String password) {
    if (password == null || password.trim().isEmpty()) {
      return null;
    }
    String stored = EmbeddedStorage.getInstance().get(ADMIN_PASSWORD_KEY);
    if (stored == null || stored.trim().isEmpty()) {
      return null;
    }
    if (!password.equals(stored)) {
      return null;
    }

    AdminUserInfo user = createAdminUser();
    String token = generateToken(user);

    LocalDateTime now = LocalDateTime.now();
    AdminSession session = new AdminSession();
    session.setSessionId(token);
    session.setUserId(ADMIN_USER_ID);
    session.setUserName(user.getName());
    session.setUserRole(user.getRole());
    session.setCreateTime(now);
    session.setLastAccessTime(now);
    session.setExpireTime(now.plusSeconds(SESSION_EXPIRE_SECONDS));

    String sessionJson = objectMapper.writeValueAsString(session);
    EmbeddedStorage.getInstance().put(SESSION_GROUP, TOKEN_KEY_ADMIN, sessionJson);
    EmbeddedStorage.getInstance().put(TOKEN_GROUP, TOKEN_KEY_ADMIN, token);

    AdminLoginResponse resp = new AdminLoginResponse();
    resp.setToken(token);
    resp.setUser(user);
    return resp;
  }

  @Override
  public boolean initAdminPassword(String password) {
    String toStore;
    if (password == null || password.trim().isEmpty()) {
      toStore = CryptoUtils.sha256("123456");
    } else {
      toStore = password;
    }
    return EmbeddedStorage.getInstance().put(ADMIN_PASSWORD_KEY, toStore);
  }

  @Override
  public AdminUserInfo validateToken(String token) {
    if (token == null || token.trim().isEmpty()) {
      return null;
    }
    String sessionJson = EmbeddedStorage.getInstance().get(SESSION_GROUP, TOKEN_KEY_ADMIN);
    if (sessionJson == null || sessionJson.trim().isEmpty()) {
      return null;
    }
    try {
      AdminSession session = objectMapper.readValue(sessionJson, AdminSession.class);
      if (session == null || !ADMIN_USER_ID.equals(session.getUserId())) {
        return null;
      }
      if (!token.equals(session.getSessionId())) {
        return null;
      }
      LocalDateTime now = LocalDateTime.now();
      if (session.getExpireTime().isBefore(now)) {
        return null;
      }
      // 验证通过：滑动过期
      session.setLastAccessTime(now);
      session.setExpireTime(now.plusSeconds(SESSION_EXPIRE_SECONDS));
      String updatedJson = objectMapper.writeValueAsString(session);
      EmbeddedStorage.getInstance().put(SESSION_GROUP, TOKEN_KEY_ADMIN, updatedJson);

      AdminUserInfo user = createAdminUser();
      if (session.getUserName() != null) {
        user.setName(session.getUserName());
      }
      if (session.getUserRole() != null) {
        user.setRole(session.getUserRole());
      }
      return user;
    } catch (Exception e) {
      return null;
    }
  }

  private AdminUserInfo createAdminUser() {
    AdminUserInfo u = new AdminUserInfo();
    u.setId(ADMIN_USER_ID);
    u.setLoginId(ADMIN_USER_ID);
    u.setName("管理员");
    u.setRole("admin");
    u.setStatus("A");
    u.setAvatar("admin");
    return u;
  }

  private String generateToken(AdminUserInfo user) {
    long now = System.currentTimeMillis();
    SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
    return Jwts.builder()
        .subject(user.getId())
        .issuedAt(new Date(now))
        .expiration(new Date(now + TOKEN_EXPIRE_MS))
        .claim("userId", user.getId())
        .claim("name", user.getName())
        .claim("role", user.getRole())
        .signWith(key)
        .compact();
  }

  private void deleteSession(String token) {
    if (token == null || token.trim().isEmpty()) {
      return;
    }
    String current = EmbeddedStorage.getInstance().get(TOKEN_GROUP, TOKEN_KEY_ADMIN);
    if (token.equals(current)) {
      EmbeddedStorage.getInstance().remove(SESSION_GROUP, TOKEN_KEY_ADMIN);
      EmbeddedStorage.getInstance().remove(TOKEN_GROUP, TOKEN_KEY_ADMIN);
    }
  }
}
