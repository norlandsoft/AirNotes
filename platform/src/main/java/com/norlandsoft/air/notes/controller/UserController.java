package com.norlandsoft.air.notes.controller;

import com.norlandsoft.air.notes.commons.ActionResponse;
import com.norlandsoft.air.notes.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @PostMapping("/rest/user/login")
  public ActionResponse<Map<String, Object>> login(@RequestBody Map<String, Object> params) {
    return userService.login(params);
  }

  @PostMapping("/rest/user/session/current")
  public ActionResponse<Map<String, Object>> currentSession(
      @RequestHeader(value = "X-User-Id", required = false) String userId,
      @RequestHeader(value = "Authorization", required = false) String authHeader) {
    String token = authHeader != null && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7) : authHeader;
    return userService.validateSession(userId, token);
  }

  @PostMapping("/rest/user/password")
  public ActionResponse<Void> changePassword(
      @RequestHeader(value = "X-User-Id", required = false) String userId,
      @RequestBody Map<String, Object> params) {
    return userService.changePassword(userId, params);
  }
}
