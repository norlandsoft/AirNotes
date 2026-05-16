package com.norlandsoft.air.notes.commons;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ActionResponse<T> {

  private Boolean success;
  private String message;
  private String code;
  private T data;

  public ActionResponse() {
  }

  public static <T> ActionResponse<T> success() {
    ActionResponse<T> r = new ActionResponse<>();
    r.setSuccess(true);
    r.setCode("100000");
    r.setMessage("操作成功");
    r.setData(null);
    return r;
  }

  public static <T> ActionResponse<T> success(T data) {
    ActionResponse<T> r = new ActionResponse<>();
    r.setSuccess(true);
    r.setCode("100000");
    r.setMessage("操作成功");
    r.setData(data);
    return r;
  }

  public static <T> ActionResponse<T> success(T data, String message) {
    ActionResponse<T> r = new ActionResponse<>();
    r.setSuccess(true);
    r.setCode("100000");
    r.setMessage(message);
    r.setData(data);
    return r;
  }

  public static <T> ActionResponse<T> success(T data, String code, String message) {
    ActionResponse<T> r = new ActionResponse<>();
    r.setSuccess(true);
    r.setCode(code);
    r.setMessage(message);
    r.setData(data);
    return r;
  }

  public static <T> ActionResponse<T> error() {
    ActionResponse<T> r = new ActionResponse<>();
    r.setSuccess(false);
    r.setCode("990000");
    r.setMessage("ERROR");
    r.setData(null);
    return r;
  }

  public static <T> ActionResponse<T> error(String message) {
    ActionResponse<T> r = new ActionResponse<>();
    r.setSuccess(false);
    r.setCode("990000");
    r.setMessage(message);
    r.setData(null);
    return r;
  }

  public static <T> ActionResponse<T> error(String code, String message) {
    ActionResponse<T> r = new ActionResponse<>();
    r.setSuccess(false);
    r.setCode(code != null && !code.trim().isEmpty() ? code : "990000");
    r.setMessage(message);
    r.setData(null);
    return r;
  }

  public static <T> ActionResponse<T> error(String code, String message, T data) {
    ActionResponse<T> r = new ActionResponse<>();
    r.setSuccess(false);
    r.setCode(code != null && !code.trim().isEmpty() ? code : "990000");
    r.setMessage(message);
    r.setData(data);
    return r;
  }
}
