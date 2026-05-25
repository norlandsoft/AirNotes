/**
 * 数据库配置 VO
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.vo;

import lombok.Data;

@Data
public class DatabaseConfigVO {
    private String driver;
    private String host;
    private Integer port;
    private String database;
    private String schema;
    private String username;
    private String password;
    private Integer minIdle;
    private Integer maxIdle;
    private Integer maxTotal;
    private Long maxWaitMillis;
}
