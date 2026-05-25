/**
 * 管理员会话实体（存 EmbeddedStorage）
 *
 * 用于序列化存入本地存储，时间字段统一使用 LocalDateTime，
 * Jackson 序列化时自动格式化为 yyyy-MM-dd HH:mm:ss 字符串。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
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
