package com.norlandsoft.air.notes.mapper;

import com.norlandsoft.air.notes.model.entity.WikiSpace;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WikiSpaceMapper {

  int insert(WikiSpace space);

  int update(WikiSpace space);

  WikiSpace selectById(@Param("id") String id);

  List<WikiSpace> selectAll();

  List<WikiSpace> selectByCondition(@Param("name") String name);

  int insertRecentSpace(@Param("userId") String userId, @Param("spaceId") String spaceId);

  int deleteRecentSpace(@Param("userId") String userId, @Param("spaceId") String spaceId);

  List<WikiSpace> selectRecentSpaces(@Param("userId") String userId);
}
