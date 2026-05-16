package com.norlandsoft.air.notes.model.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class DocDetailVO {

  private String id;
  private String title;
  private String icon;
  private String space;
  private String parentId;
  private String format;
  private String content;
  private String creatorId;
  private String creatorName;
  private LocalDateTime createTime;
  private LocalDateTime updateTime;
  private List<DocMenuVO> breadCrumb;
}
