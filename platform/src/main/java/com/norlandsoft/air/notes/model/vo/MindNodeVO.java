package com.norlandsoft.air.notes.model.vo;

import lombok.Data;

@Data
public class MindNodeVO {

  private String id;
  private String value;
  private String parentId;
  private String documentId;
  private Integer level;
}
