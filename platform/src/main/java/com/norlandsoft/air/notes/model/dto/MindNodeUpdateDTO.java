/**
 * 思维导图节点更新 DTO
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.model.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class MindNodeUpdateDTO {
    /** 思维导图节点列表 */
    private List<Map<String, Object>> items;
}
