package com.norlandsoft.air.notes.mapper;

import com.norlandsoft.air.notes.model.entity.WikiDocument;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WikiDocMapper {

  int insert(WikiDocument doc);

  int update(WikiDocument doc);

  WikiDocument selectById(@Param("id") String id);

  int deleteById(@Param("id") String id);

  List<WikiDocument> selectMenuItems(@Param("space") String space);

  List<WikiDocument.BreadCrumbItem> selectBreadCrumb(@Param("id") String id);
}
