package com.norlandsoft.air.notes.service;

import com.norlandsoft.air.notes.commons.ActionResponse;
import com.norlandsoft.air.notes.model.vo.SpaceVO;

import java.util.List;
import java.util.Map;

public interface WikiSpaceService {

  ActionResponse<SpaceVO> createSpace(Map<String, Object> params, String userId);

  ActionResponse<SpaceVO> updateSpace(Map<String, Object> params);

  ActionResponse<List<SpaceVO>> getSpaceList(String userId, Map<String, Object> params);

  ActionResponse<SpaceVO> getSpaceInfo(String id);

  ActionResponse<Void> addRecentSpace(String userId, String spaceId);

  ActionResponse<List<SpaceVO>> getRecentSpaces(String userId);
}
