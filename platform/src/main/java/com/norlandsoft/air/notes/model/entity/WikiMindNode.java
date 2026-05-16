package com.norlandsoft.air.notes.model.entity;

import lombok.Data;

@Data
public class WikiMindNode {

  private String id;
  private String value;
  private String parentId;
  private String documentId;
  private Integer level;
}
