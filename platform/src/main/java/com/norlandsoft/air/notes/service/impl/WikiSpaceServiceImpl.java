/**
 * 工作空间服务实现
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.service.impl;

import com.norlandsoft.air.framework.sdk.util.IDGenerator;
import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.mapper.WikiSpaceMapper;
import com.norlandsoft.air.notes.model.dto.WikiSpaceCreateDTO;
import com.norlandsoft.air.notes.model.dto.WikiSpaceUpdateDTO;
import com.norlandsoft.air.notes.model.entity.WikiSpace;
import com.norlandsoft.air.notes.model.vo.SpaceVO;
import com.norlandsoft.air.notes.service.WikiSpaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WikiSpaceServiceImpl implements WikiSpaceService {

  private final WikiSpaceMapper spaceMapper;

  @Override
  public ActionResponse<SpaceVO> createSpace(WikiSpaceCreateDTO dto, String userId) {
    try {
      WikiSpace space = new WikiSpace();
      space.setId(IDGenerator.shortID());
      space.setName(dto.getName());
      space.setDescription(dto.getDescription());
      space.setIcon(dto.getIcon());
      space.setStatus("A");
      space.setCreatorId(userId);
      space.setCreateTime(LocalDateTime.now());
      space.setUpdateTime(LocalDateTime.now());

      spaceMapper.insert(space);
      return ActionResponse.success(toSpaceVO(space));
    } catch (Exception e) {
      log.error("创建空间失败", e);
      return ActionResponse.error("990500", "创建空间失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<SpaceVO> updateSpace(WikiSpaceUpdateDTO dto) {
    try {
      if (dto.getId() == null || dto.getId().trim().isEmpty()) {
        return ActionResponse.error("990501", "空间ID不能为空");
      }

      WikiSpace space = new WikiSpace();
      space.setId(dto.getId());
      space.setName(dto.getName());
      space.setDescription(dto.getDescription());
      space.setIcon(dto.getIcon());
      space.setStatus(dto.getStatus());

      spaceMapper.update(space);

      WikiSpace updated = spaceMapper.selectById(dto.getId());
      return ActionResponse.success(toSpaceVO(updated));
    } catch (Exception e) {
      log.error("更新空间失败", e);
      return ActionResponse.error("990502", "更新空间失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<List<SpaceVO>> getSpaceList(String userId, WikiSpaceCreateDTO dto) {
    try {
      String name = dto != null ? dto.getName() : null;
      List<WikiSpace> spaces = spaceMapper.selectByCondition(name);
      List<SpaceVO> result = new ArrayList<>();
      for (WikiSpace space : spaces) {
        result.add(toSpaceVO(space));
      }
      return ActionResponse.success(result);
    } catch (Exception e) {
      log.error("查询空间列表失败", e);
      return ActionResponse.error("990503", "查询空间列表失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<SpaceVO> getSpaceInfo(String id) {
    try {
      WikiSpace space = spaceMapper.selectById(id);
      if (space == null) {
        return ActionResponse.error("990504", "空间不存在");
      }
      return ActionResponse.success(toSpaceVO(space));
    } catch (Exception e) {
      log.error("查询空间详情失败", e);
      return ActionResponse.error("990505", "查询空间详情失败: " + e.getMessage());
    }
  }

  @Transactional(rollbackFor = Exception.class)
  @Override
  public ActionResponse<Void> addRecentSpace(String userId, String spaceId) {
    try {
      spaceMapper.deleteRecentSpace(userId, spaceId);
      spaceMapper.insertRecentSpace(userId, spaceId);
      return ActionResponse.success();
    } catch (Exception e) {
      log.error("添加最近访问记录失败", e);
      return ActionResponse.error("990506", "添加最近访问记录失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<List<SpaceVO>> getRecentSpaces(String userId) {
    try {
      List<WikiSpace> spaces = spaceMapper.selectRecentSpaces(userId);
      List<SpaceVO> result = new ArrayList<>();
      for (WikiSpace space : spaces) {
        result.add(toSpaceVO(space));
      }
      return ActionResponse.success(result);
    } catch (Exception e) {
      log.error("查询最近访问空间失败", e);
      return ActionResponse.error("990507", "查询最近访问空间失败: " + e.getMessage());
    }
  }

  private SpaceVO toSpaceVO(WikiSpace space) {
    if (space == null) {
      return null;
    }
    SpaceVO vo = new SpaceVO();
    vo.setId(space.getId());
    vo.setName(space.getName());
    vo.setDescription(space.getDescription());
    vo.setIcon(space.getIcon());
    vo.setStatus(space.getStatus());
    vo.setCreatorName(space.getCreatorName());
    vo.setCreateTime(space.getCreateTime());
    vo.setUpdateTime(space.getUpdateTime());
    return vo;
  }
}
