/**
 * 文档服务接口
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.service;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.model.dto.DocUpdateDTO;
import com.norlandsoft.air.notes.model.vo.DocDetailVO;
import com.norlandsoft.air.notes.model.vo.DocMenuVO;
import com.norlandsoft.air.notes.model.vo.MindNodeVO;

import java.util.List;
import java.util.Map;

public interface WikiDocsService {

  ActionResponse<List<DocMenuVO>> getDocumentMenu(String spaceId);

  ActionResponse<DocDetailVO> getDocumentInfo(String id);

  ActionResponse<DocDetailVO> saveDocument(DocUpdateDTO dto, String userId);

  ActionResponse<Void> deleteDocument(String id);

  ActionResponse<Void> updateMindMap(List<Map<String, Object>> items);

  ActionResponse<List<MindNodeVO>> getMindMapItems(String documentId);
}
