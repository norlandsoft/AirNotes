package com.norlandsoft.air.notes.admin.controller;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.admin.model.dto.AdminLoginRequest;
import com.norlandsoft.air.notes.admin.model.dto.AdminPasswordResetDTO;
import com.norlandsoft.air.notes.admin.model.vo.AdminLoginResponse;
import com.norlandsoft.air.notes.admin.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理员用户接口
 *
 * 路径前缀 /admin/user，提供 admin 登录与密码修改。
 * 登录验证使用 AdminUserService（基于 EmbeddedStorage），不依赖 Redis。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@RestController
@RequestMapping("/admin/user")
@RequiredArgsConstructor
public class AdminUserController {

  private static final String ADMIN_USER_ID = "admin";

  private final AdminUserService adminUserService;

  /**
   * admin 登录
   *
   * 请求体与平台 /rest/platform/user/login 一致（id、password），便于前端按用户选择路径。
   * 仅允许 id 为 admin 的用户通过此接口登录。
   */
  @PostMapping("/login")
  public ActionResponse<AdminLoginResponse> login(@RequestBody AdminLoginRequest request) {
    if (request == null || request.getId() == null || request.getPassword() == null) {
      return ActionResponse.error("990023", "用户名和密码不能为空");
    }
    if (!ADMIN_USER_ID.equalsIgnoreCase(request.getId().trim())) {
      return ActionResponse.error("990026", "仅支持 admin 账号登录，请使用 /admin/user/login");
    }
    AdminLoginResponse resp = adminUserService.login(request.getPassword().trim());
    if (resp != null) {
      return ActionResponse.success(resp, "登录成功");
    }
    return ActionResponse.error("登录失败，请检查管理员密码");
  }

  /**
   * 修改 admin 密码
   *
   * 请求头需携带 X-User-Id=admin 及有效 token。
   * 密码由前端 SHA256 加密后传输。
   */
  @PostMapping("/changePassword")
  public ActionResponse<Void> changePassword(
      @RequestHeader(value = "X-User-Id", required = false) String userId,
      @RequestBody AdminPasswordResetDTO resetDTO) {
    if (userId == null || !ADMIN_USER_ID.equalsIgnoreCase(userId.trim())) {
      return ActionResponse.error("990025", "仅 admin 用户可修改管理员密码");
    }
    if (resetDTO == null || resetDTO.getPassword() == null || resetDTO.getPassword().trim().isEmpty()) {
      return ActionResponse.error("990023", "新密码不能为空");
    }
    boolean success = adminUserService.initAdminPassword(resetDTO.getPassword().trim());
    if (success) {
      return ActionResponse.success(null, "admin 密码修改成功");
    }
    return ActionResponse.error("990024", "admin 密码修改失败");
  }
}
