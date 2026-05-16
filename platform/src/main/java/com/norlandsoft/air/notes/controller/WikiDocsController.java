package com.norlandsoft.air.notes.controller;

import com.norlandsoft.air.notes.commons.ActionResponse;
import com.norlandsoft.air.notes.model.vo.DocDetailVO;
import com.norlandsoft.air.notes.model.vo.DocMenuVO;
import com.norlandsoft.air.notes.model.vo.MindNodeVO;
import com.norlandsoft.air.notes.service.WikiDocsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class WikiDocsController {

  private final WikiDocsService docsService;

  @PostMapping("/rest/wiki/docs/menu")
  public ActionResponse<List<DocMenuVO>> getDocumentMenu(@RequestBody Map<String, Object> params) {
    String space = (String) params.get("space");
    return docsService.getDocumentMenu(space);
  }

  @PostMapping("/rest/wiki/docs/info")
  public ActionResponse<DocDetailVO> getDocumentInfo(@RequestBody Map<String, Object> params) {
    String id = (String) params.get("id");
    return docsService.getDocumentInfo(id);
  }

  @PostMapping("/rest/wiki/docs/update")
  public ActionResponse<DocDetailVO> saveDocument(
      @RequestHeader(value = "X-User-Id", required = false) String userId,
      @RequestBody Map<String, Object> params) {
    return docsService.saveDocument(params, userId);
  }

  @PostMapping("/rest/wiki/docs/remove")
  public ActionResponse<Void> deleteDocument(@RequestBody Map<String, Object> params) {
    String id = (String) params.get("id");
    return docsService.deleteDocument(id);
  }

  @PostMapping("/rest/wiki/mind/update")
  @SuppressWarnings("unchecked")
  public ActionResponse<Void> updateMindMap(@RequestBody List<Map<String, Object>> items) {
    return docsService.updateMindMap(items);
  }

  @PostMapping("/rest/wiki/mind/items")
  public ActionResponse<List<MindNodeVO>> getMindMapItems(@RequestBody Map<String, Object> params) {
    String documentId = (String) params.get("documentId");
    return docsService.getMindMapItems(documentId);
  }
}
