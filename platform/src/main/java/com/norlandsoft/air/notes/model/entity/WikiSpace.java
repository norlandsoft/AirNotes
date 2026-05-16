package com.norlandsoft.air.notes.model.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WikiSpace {

  private String id;
  private String name;
  private String description;
  private String icon;
  private String status;
  private String creatorId;
  private String creatorName;
  private LocalDateTime createTime;
  private LocalDateTime updateTime;
}
