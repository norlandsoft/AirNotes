/**
 * 工作空间服务接口
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.service;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.model.dto.WikiSpaceCreateDTO;
import com.norlandsoft.air.notes.model.dto.WikiSpaceUpdateDTO;
import com.norlandsoft.air.notes.model.vo.SpaceVO;

import java.util.List;

public interface WikiSpaceService {

  ActionResponse<SpaceVO> createSpace(WikiSpaceCreateDTO dto, String userId);

  ActionResponse<SpaceVO> updateSpace(WikiSpaceUpdateDTO dto);

  ActionResponse<List<SpaceVO>> getSpaceList(String userId, WikiSpaceCreateDTO dto);

  ActionResponse<SpaceVO> getSpaceInfo(String id);

  ActionResponse<Void> addRecentSpace(String userId, String spaceId);

  ActionResponse<List<SpaceVO>> getRecentSpaces(String userId);
}
