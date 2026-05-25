/**
 * 管理员用户信息 VO
 *
 * 仅包含展示字段，不含密码等敏感信息。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
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
