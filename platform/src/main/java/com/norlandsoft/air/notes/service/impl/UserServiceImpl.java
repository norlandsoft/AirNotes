package com.norlandsoft.air.notes.service.impl;

import com.norlandsoft.air.notes.commons.ActionResponse;
import com.norlandsoft.air.notes.commons.IDGenerator;
import com.norlandsoft.air.notes.commons.JwtUtils;
import com.norlandsoft.air.notes.commons.PasswordUtils;
import com.norlandsoft.air.notes.mapper.UserMapper;
import com.norlandsoft.air.notes.model.entity.User;
import com.norlandsoft.air.notes.service.UserService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService, CommandLineRunner {

  private final UserMapper userMapper;

  @Override
  public void run(String... args) {
    initDefaultUser();
  }

  @Override
  public void initDefaultUser() {
    User existing = userMapper.selectById("admin");
    if (existing == null) {
      String salt = PasswordUtils.generateSalt();
      // Frontend sends SHA256("admin") first, backend stores SHA256(frontendHash + salt)
      String frontendHash = sha256Raw("admin");
      String encodedPassword = PasswordUtils.encode(frontendHash, salt);

      User user = new User();
      user.setId("admin");
      user.setPassword(encodedPassword);
      user.setSalt(salt);
      user.setName("Admin");
      user.setStatus("A");
      user.setRole("admin");
      user.setCreateTime(LocalDateTime.now());
      user.setUpdateTime(LocalDateTime.now());
      userMapper.insert(user);
      log.info("Default admin user created (password: admin)");
    }
  }

  @Override
  public ActionResponse<Map<String, Object>> login(Map<String, Object> params) {
    try {
      String id = (String) params.get("id");
      String password = (String) params.get("password");

      if (id == null || password == null) {
        return ActionResponse.error("990001", "用户名或密码不能为空");
      }

      User user = userMapper.selectById(id);
      if (user == null) {
        return ActionResponse.error("990002", "用户不存在");
      }
      if (!"A".equals(user.getStatus())) {
        return ActionResponse.error("990003", "用户已禁用");
      }

      String encodedPassword = PasswordUtils.encode(password, user.getSalt());
      if (!encodedPassword.equals(user.getPassword())) {
        return ActionResponse.error("990004", "密码错误");
      }

      String token = JwtUtils.generateToken(user.getId(), user.getName(), user.getRole());

      Map<String, Object> data = new HashMap<>();
      data.put("token", token);
      data.put("user", toUserVO(user));

      return ActionResponse.success(data);
    } catch (Exception e) {
      log.error("登录失败", e);
      return ActionResponse.error("990005", "登录失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<Map<String, Object>> validateSession(String userId, String token) {
    try {
      if (token == null || !JwtUtils.validate(token)) {
        return ActionResponse.error("990006", "会话已过期");
      }

      Claims claims = JwtUtils.parseToken(token);
      String tokenUserId = claims.getSubject();
      if (userId != null && !userId.equals(tokenUserId)) {
        return ActionResponse.error("990007", "会话无效");
      }

      User user = userMapper.selectById(tokenUserId);
      if (user == null || !"A".equals(user.getStatus())) {
        return ActionResponse.error("990008", "用户不存在或已禁用");
      }

      Map<String, Object> data = new HashMap<>();
      data.put("user", toUserVO(user));
      return ActionResponse.success(data);
    } catch (Exception e) {
      return ActionResponse.error("990009", "会话验证失败");
    }
  }

  @Override
  public ActionResponse<Void> changePassword(String userId, Map<String, Object> params) {
    try {
      String oldPassword = (String) params.get("oldPassword");
      String newPassword = (String) params.get("newPassword");

      if (oldPassword == null || newPassword == null) {
        return ActionResponse.error("990010", "旧密码和新密码不能为空");
      }

      User user = userMapper.selectById(userId);
      if (user == null) {
        return ActionResponse.error("990011", "用户不存在");
      }

      String encodedOld = PasswordUtils.encode(oldPassword, user.getSalt());
      if (!encodedOld.equals(user.getPassword())) {
        return ActionResponse.error("990012", "旧密码错误");
      }

      String newSalt = PasswordUtils.generateSalt();
      String encodedNew = PasswordUtils.encode(newPassword, newSalt);
      userMapper.updatePassword(userId, encodedNew, newSalt);

      return ActionResponse.success();
    } catch (Exception e) {
      log.error("修改密码失败", e);
      return ActionResponse.error("990013", "修改密码失败: " + e.getMessage());
    }
  }

  private Map<String, Object> toUserVO(User user) {
    Map<String, Object> vo = new HashMap<>();
    vo.put("id", user.getId());
    vo.put("name", user.getName());
    vo.put("avatar", user.getAvatar());
    vo.put("role", user.getRole());
    return vo;
  }

  private String sha256Raw(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder();
      for (byte b : hash) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
