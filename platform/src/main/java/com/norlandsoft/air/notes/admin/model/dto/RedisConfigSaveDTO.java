/**
 * Redis 配置保存 DTO
 *
 * 用于接收前端保存 Redis 连接的请求参数。
 * 持久化到 EmbeddedStorage（H2）的 paas 组。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.dto;

import lombok.Data;

@Data
public class RedisConfigSaveDTO {
    /** 主机地址 */
    private String host;
    /** 端口 */
    private Integer port;
    /** 密码 */
    private String password;
    /** 数据库索引，0-15 */
    private Integer database;
    /** 最大总连接数（默认 128） */
    private Integer maxTotal;
    /** 最大空闲连接数（默认 64） */
    private Integer maxIdle;
    /** 最小空闲连接数（默认 16） */
    private Integer minIdle;
    /** 获取连接最大等待毫秒（默认 3000） */
    private Long maxWaitMillis;
}
