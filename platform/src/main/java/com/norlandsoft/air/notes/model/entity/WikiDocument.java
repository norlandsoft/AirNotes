package com.norlandsoft.air.notes.model.entity;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class WikiDocument {

  private String id;
  private String title;
  private String icon;
  private String space;
  private String parentId;
  private String format;
  private String fileType;
  private String content;
  private Integer sortOrder;
  private String status;
  private String creatorId;
  private String creatorName;
  private LocalDateTime createTime;
  private LocalDateTime updateTime;
  private List<BreadCrumbItem> breadCrumb;

  @Data
  public static class BreadCrumbItem {
    private String key;
    private String label;
  }
}
