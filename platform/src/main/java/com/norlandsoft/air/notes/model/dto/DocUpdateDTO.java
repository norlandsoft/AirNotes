/**
 * 文档更新请求 DTO
 *
 * 同时用于创建和更新文档。id 为空时为创建，非空时为更新。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.model.dto;

import lombok.Data;

@Data
public class DocUpdateDTO {
    /** 文档 ID（更新时必填） */
    private String id;
    /** 文档标题 */
    private String title;
    /** 图标 */
    private String icon;
    /** 所属工作空间 */
    private String space;
    /** 父文档 ID，根文档为 "000000" */
    private String parentId;
    /** 文档格式：doc/board/mind */
    private String format;
    /** 文件类型 */
    private String fileType;
    /** 文档内容（JSON） */
    private String content;
    /** 排序序号 */
    private Integer sortOrder;
}
