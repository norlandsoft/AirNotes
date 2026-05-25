/**
 * Redis 配置 VO
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.admin.model.vo;

import lombok.Data;

@Data
public class RedisConfigVO {
    private String host;
    private Integer port;
    private String password;
    private Integer database;
    private Integer maxTotal;
    private Integer maxIdle;
    private Integer minIdle;
    private Long maxWaitMillis;
}
