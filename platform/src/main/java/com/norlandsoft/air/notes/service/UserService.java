package com.norlandsoft.air.notes.service;

import com.norlandsoft.air.notes.commons.ActionResponse;

import java.util.Map;

public interface UserService {

  ActionResponse<Map<String, Object>> login(Map<String, Object> params);

  ActionResponse<Map<String, Object>> validateSession(String userId, String token);

  ActionResponse<Void> changePassword(String userId, Map<String, Object> params);

  void initDefaultUser();
}
