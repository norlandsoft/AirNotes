/**
 * 工作空间控制器
 *
 * 提供工作空间的 CRUD 操作、最近访问记录管理。
 * 用户身份通过 AdminAuthFilter / SsoAuthFilter 注入到 request attribute 中。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.controller;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.model.dto.WikiSpaceCreateDTO;
import com.norlandsoft.air.notes.model.dto.WikiSpaceUpdateDTO;
import com.norlandsoft.air.notes.model.vo.SpaceVO;
import com.norlandsoft.air.notes.service.WikiSpaceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/rest/wiki/space")
public class WikiSpaceController {

  private final WikiSpaceService spaceService;

  /**
   * 从请求属性中提取用户 ID
   * 优先从 adminUser 属性获取，其次从 ssoUser 属性获取
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

  @PostMapping("/create")
  public ActionResponse<SpaceVO> createSpace(
      HttpServletRequest request,
      @RequestBody WikiSpaceCreateDTO dto) {
    String userId = extractUserId(request);
    return spaceService.createSpace(dto, userId);
  }

  @PostMapping("/update")
  public ActionResponse<SpaceVO> updateSpace(@RequestBody WikiSpaceUpdateDTO dto) {
    if (dto.getId() == null || dto.getId().trim().isEmpty()) {
      // id 为空时当作创建处理
      WikiSpaceCreateDTO createDTO = new WikiSpaceCreateDTO();
      createDTO.setName(dto.getName());
      createDTO.setDescription(dto.getDescription());
      createDTO.setIcon(dto.getIcon());
      return spaceService.createSpace(createDTO, null);
    }
    return spaceService.updateSpace(dto);
  }

  @PostMapping("/list")
  public ActionResponse<List<SpaceVO>> getSpaceList(
      HttpServletRequest request,
      @RequestBody(required = false) WikiSpaceCreateDTO dto) {
    String userId = extractUserId(request);
    return spaceService.getSpaceList(userId, dto);
  }

  @PostMapping("/info")
  public ActionResponse<SpaceVO> getSpaceInfo(@RequestBody Map<String, String> params) {
    String id = params.get("id");
    return spaceService.getSpaceInfo(id);
  }

  @PostMapping("/recent/add")
  public ActionResponse<Void> addRecentSpace(
      HttpServletRequest request,
      @RequestBody Map<String, String> params) {
    String userId = extractUserId(request);
    String spaceId = params.get("spaceId");
    if (spaceId == null) {
      spaceId = params.get("id");
    }
    return spaceService.addRecentSpace(userId, spaceId);
  }

  @PostMapping("/recent")
  public ActionResponse<List<SpaceVO>> getRecentSpaces(HttpServletRequest request) {
    String userId = extractUserId(request);
    return spaceService.getRecentSpaces(userId);
  }
}
