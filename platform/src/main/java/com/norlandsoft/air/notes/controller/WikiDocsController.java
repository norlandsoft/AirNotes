/**
 * 文档控制器
 *
 * 提供文档菜单、文档详情、文档保存删除、思维导图操作。
 * 用户身份通过 AdminAuthFilter / SsoAuthFilter 注入到 request attribute 中。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.controller;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.model.dto.DocMenuQueryDTO;
import com.norlandsoft.air.notes.model.dto.DocUpdateDTO;
import com.norlandsoft.air.notes.model.dto.MindNodeQueryDTO;
import com.norlandsoft.air.notes.model.dto.MindNodeUpdateDTO;
import com.norlandsoft.air.notes.model.vo.DocDetailVO;
import com.norlandsoft.air.notes.model.vo.DocMenuVO;
import com.norlandsoft.air.notes.model.vo.MindNodeVO;
import com.norlandsoft.air.notes.service.WikiDocsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class WikiDocsController {

  private final WikiDocsService docsService;

  /**
   * 从请求属性中提取用户 ID
   */
  @SuppressWarnings("unchecked")
  private String extractUserId(HttpServletRequest request) {
    Object adminUser = request.getAttribute("adminUser");
    if (adminUser != null) {
      return "admin";
    }
    Map<String, Object> ssoUser = (Map<String, Object>) request.getAttribute("ssoUser");
    if (ssoUser != null) {
      Object uid = ssoUser.get("userId");
      if (uid == null) uid = ssoUser.get("sub");
      if (uid == null) uid = ssoUser.get("id");
      return uid != null ? uid.toString() : null;
    }
    return null;
  }

  @PostMapping("/rest/wiki/docs/menu")
  public ActionResponse<List<DocMenuVO>> getDocumentMenu(@RequestBody DocMenuQueryDTO dto) {
    return docsService.getDocumentMenu(dto.getSpace());
  }

  @PostMapping("/rest/wiki/docs/info")
  public ActionResponse<DocDetailVO> getDocumentInfo(@RequestBody Map<String, String> params) {
    return docsService.getDocumentInfo(params.get("id"));
  }

  @PostMapping("/rest/wiki/docs/update")
  public ActionResponse<DocDetailVO> saveDocument(
      HttpServletRequest request,
      @RequestBody DocUpdateDTO dto) {
    String userId = extractUserId(request);
    return docsService.saveDocument(dto, userId);
  }

  @PostMapping("/rest/wiki/docs/remove")
  public ActionResponse<Void> deleteDocument(@RequestBody Map<String, String> params) {
    return docsService.deleteDocument(params.get("id"));
  }

  @PostMapping("/rest/wiki/mind/update")
  public ActionResponse<Void> updateMindMap(@RequestBody MindNodeUpdateDTO dto) {
    return docsService.updateMindMap(dto.getItems());
  }

  @PostMapping("/rest/wiki/mind/items")
  public ActionResponse<List<MindNodeVO>> getMindMapItems(@RequestBody MindNodeQueryDTO dto) {
    return docsService.getMindMapItems(dto.getDocumentId());
  }
}
