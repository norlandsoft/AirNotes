package com.norlandsoft.air.notes.controller;

import com.norlandsoft.air.notes.commons.ActionResponse;
import com.norlandsoft.air.notes.model.vo.SpaceVO;
import com.norlandsoft.air.notes.service.WikiSpaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/rest/wiki/space")
public class WikiSpaceController {

  private final WikiSpaceService spaceService;

  @PostMapping("/create")
  public ActionResponse<SpaceVO> createSpace(
      @RequestHeader(value = "X-User-Id", required = false) String userId,
      @RequestBody Map<String, Object> params) {
    return spaceService.createSpace(params, userId);
  }

  @PostMapping("/update")
  public ActionResponse<SpaceVO> updateSpace(@RequestBody Map<String, Object> params) {
    if (params.get("id") == null || params.get("id").toString().trim().isEmpty()) {
      return spaceService.createSpace(params, null);
    }
    return spaceService.updateSpace(params);
  }

  @PostMapping("/list")
  public ActionResponse<?> getSpaceList(
      @RequestHeader(value = "X-User-Id", required = false) String userId,
      @RequestBody Map<String, Object> params) {
    return spaceService.getSpaceList(userId, params);
  }

  @PostMapping("/info")
  public ActionResponse<SpaceVO> getSpaceInfo(@RequestBody Map<String, Object> params) {
    String id = (String) params.get("id");
    return spaceService.getSpaceInfo(id);
  }

  @PostMapping("/recent/add")
  public ActionResponse<Void> addRecentSpace(
      @RequestHeader(value = "X-User-Id", required = false) String userId,
      @RequestBody Map<String, Object> params) {
    String spaceId = (String) params.get("spaceId");
    if (spaceId == null) {
      spaceId = (String) params.get("id");
    }
    return spaceService.addRecentSpace(userId, spaceId);
  }

  @PostMapping("/recent")
  public ActionResponse<?> getRecentSpaces(
      @RequestHeader(value = "X-User-Id", required = false) String userId) {
    return spaceService.getRecentSpaces(userId);
  }
}
