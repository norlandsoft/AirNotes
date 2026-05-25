/**
 * 管理员登录请求 DTO
 *
 * 与平台 UserLoginDTO 字段一致，供前端统一传参。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
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
