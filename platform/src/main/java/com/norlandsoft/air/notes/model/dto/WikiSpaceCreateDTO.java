/**
 * 创建工作空间请求 DTO
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.model.dto;

import lombok.Data;

@Data
public class WikiSpaceCreateDTO {
    /** 工作空间名称 */
    private String name;
    /** 工作空间描述 */
    private String description;
    /** 图标 */
    private String icon;
}
