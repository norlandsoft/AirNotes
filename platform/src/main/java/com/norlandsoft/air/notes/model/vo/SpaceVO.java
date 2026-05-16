package com.norlandsoft.air.notes.model.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SpaceVO {

  private String id;
  private String name;
  private String description;
  private String icon;
  private String status;
  private String creatorName;
  private LocalDateTime createTime;
  private LocalDateTime updateTime;
}
