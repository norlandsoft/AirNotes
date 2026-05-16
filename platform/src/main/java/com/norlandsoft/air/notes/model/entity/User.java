package com.norlandsoft.air.notes.model.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class User {

  private String id;
  private String password;
  private String salt;
  private String name;
  private String avatar;
  private String status;
  private String role;
  private LocalDateTime createTime;
  private LocalDateTime updateTime;
}
