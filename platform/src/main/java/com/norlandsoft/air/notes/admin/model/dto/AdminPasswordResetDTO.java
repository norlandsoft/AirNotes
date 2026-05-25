/**
 * 管理员密码重置请求 DTO
 *
 * 用于接收修改 admin 密码的请求，密码由前端 SHA256 加密后传输。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.dto;

import lombok.Data;

@Data
public class AdminPasswordResetDTO {
    /** 新密码，前端传输前已 SHA256 加密；不提供则使用默认密码 123456 */
    private String password;
}
