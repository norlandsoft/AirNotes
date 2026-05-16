package com.norlandsoft.air.notes.mapper;

import com.norlandsoft.air.notes.model.entity.WikiMindNode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WikiMindMapper {

  int insert(WikiMindNode node);

  int insertOrUpdate(WikiMindNode node);

  int deleteByDocumentId(@Param("documentId") String documentId);

  List<WikiMindNode> selectByDocumentId(@Param("documentId") String documentId);
}
