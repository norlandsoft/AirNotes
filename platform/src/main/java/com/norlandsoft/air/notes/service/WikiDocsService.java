package com.norlandsoft.air.notes.service;

import com.norlandsoft.air.notes.commons.ActionResponse;
import com.norlandsoft.air.notes.model.vo.DocDetailVO;
import com.norlandsoft.air.notes.model.vo.DocMenuVO;
import com.norlandsoft.air.notes.model.vo.MindNodeVO;

import java.util.List;
import java.util.Map;

public interface WikiDocsService {

  ActionResponse<List<DocMenuVO>> getDocumentMenu(String spaceId);

  ActionResponse<DocDetailVO> getDocumentInfo(String id);

  ActionResponse<DocDetailVO> saveDocument(Map<String, Object> params, String userId);

  ActionResponse<Void> deleteDocument(String id);

  ActionResponse<Void> updateMindMap(List<Map<String, Object>> items);

  ActionResponse<List<MindNodeVO>> getMindMapItems(String documentId);
}
