/**
 * 管理员登录响应 VO
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.vo;

import lombok.Data;

@Data
public class AdminLoginResponse {
    private String token;
    private AdminUserInfo user;
}
