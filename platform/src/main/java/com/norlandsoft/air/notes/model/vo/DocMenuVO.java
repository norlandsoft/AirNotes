package com.norlandsoft.air.notes.model.vo;

import lombok.Data;

import java.util.List;

@Data
public class DocMenuVO {

  private String key;
  private String label;
  private String parent;
  private String type;
  private String data;
  private String image;
  private List<DocMenuVO> children;
}
