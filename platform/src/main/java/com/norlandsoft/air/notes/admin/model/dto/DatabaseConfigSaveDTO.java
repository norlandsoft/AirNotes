/**
 * 数据库配置保存 DTO
 *
 * 用于接收前端保存数据库连接的请求参数。
 * 持久化到 EmbeddedStorage（H2）的 paas 组。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.dto;

import lombok.Data;

@Data
public class DatabaseConfigSaveDTO {
    /** 驱动类型，如 postgresql、mysql */
    private String driver;
    /** 主机地址 */
    private String host;
    /** 端口 */
    private Integer port;
    /** 数据库名 */
    private String database;
    /** 数据库 Schema，默认 public */
    private String schema;
    /** 用户名 */
    private String username;
    /** 密码 */
    private String password;
    /** 最小空闲连接数（默认 5） */
    private Integer minIdle;
    /** 最大空闲连接数（默认 10） */
    private Integer maxIdle;
    /** 最大总连接数（默认 20） */
    private Integer maxTotal;
    /** 获取连接最大等待毫秒（默认 30000） */
    private Long maxWaitMillis;
}
