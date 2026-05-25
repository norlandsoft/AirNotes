package com.norlandsoft.air.notes.admin.service;

import com.norlandsoft.air.notes.admin.model.vo.AdminLoginResponse;
import com.norlandsoft.air.notes.admin.model.vo.AdminUserInfo;

/**
 * 管理员用户服务接口
 *
 * 提供 admin 登录与密码管理，由 platform 本地处理，不依赖 Redis。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
public interface AdminUserService {

  /**
   * admin 登录验证
   *
   * @param password 前端已 SHA256 加密的密码
   *
   * @return 登录成功返回 token 与用户信息，失败返回 null
   */
  AdminLoginResponse login(String password);

  /**
   * 初始化/重置 admin 密码
   *
   * @param password 新密码（前端已 SHA256 加密），null 或空则使用默认 123456
   *
   * @return 是否设置成功
   */
  boolean initAdminPassword(String password);

  /**
   * 根据 token 验证 admin 会话是否有效
   *
   * @param token 登录时下发的 JWT
   *
   * @return 有效返回 AdminUserInfo，无效或过期返回 null
   */
  AdminUserInfo validateToken(String token);
}
