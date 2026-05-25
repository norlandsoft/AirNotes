/**
 * SSO 登录代理控制器
 *
 * 作为前端与 Framework SSO 之间的代理层。前端发送登录请求到本控制器，
 * 本控制器转发到 Framework 的 SSO 认证接口，返回 SSO token。
 *
 * 数据一致性保证：
 * - SSO 用户信息在登录时缓存到内存，刷新时优先从缓存读取完整数据
 * - 服务重启后缓存丢失，回退到 JWT Claims 并补充缺失字段（loginId、avatar）
 * - avatar 字段统一为短编号形式（如 "u01"、"admin"），前端负责组装完整 URL
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.controller;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.framework.sdk.autoconfigure.SsoClientProperties;
import com.norlandsoft.air.framework.sdk.service.SsoRegistrationService;
import com.norlandsoft.air.framework.sdk.service.SsoTokenService;
import com.norlandsoft.air.notes.admin.service.AdminUserService;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/rest/auth")
public class SsoLoginProxyController {

    private static final Logger log = LoggerFactory.getLogger(SsoLoginProxyController.class);

    /** SSO 用户信息内存缓存，key 为 userId */
    private static final ConcurrentHashMap<String, Map<String, Object>> SSO_USER_CACHE = new ConcurrentHashMap<>();
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    @Autowired(required = false)
    private SsoRegistrationService ssoRegistrationService;

    @Autowired(required = false)
    private SsoClientProperties ssoClientProperties;

    @Autowired(required = false)
    private SsoTokenService ssoTokenService;

    @Autowired(required = false)
    private AdminUserService adminUserService;

    /**
     * 普通用户登录（代理到 Framework SSO）
     *
     * 登录成功后提取并规范化用户信息（确保 avatar 为短编号），缓存到内存。
     *
     * @param loginRequest 登录请求，包含 id 和 password 字段
     * @return SSO 认证结果（包含 token 和用户信息）
     */
    @PostMapping("/login")
    public ActionResponse<Object> login(@RequestBody Map<String, String> loginRequest) {
        String userId = loginRequest.get("id");
        String password = loginRequest.get("password");

        // admin 用户应使用管理后台登录
        if ("admin".equalsIgnoreCase(userId)) {
            return ActionResponse.error("990026", "管理员请使用管理后台登录");
        }

        if (userId == null || userId.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ActionResponse.error("990001", "用户名和密码不能为空");
        }

        // 检查 SSO 服务是否可用
        if (ssoRegistrationService == null || ssoClientProperties == null
                || ssoClientProperties.getRegToken() == null) {
            return ActionResponse.error("990027", "SSO 认证服务不可用，请检查 Framework 服务是否正常运行");
        }

        try {
            // 代理到 Framework SSO 认证
            Map<String, Object> ssoResult = ssoRegistrationService.authenticateUser(ssoClientProperties, userId, password);

            if (ssoResult == null) {
                return ActionResponse.error("990028", "用户名或密码错误");
            }

            // 规范化用户信息并缓存
            extractAndNormalizeUser(ssoResult);

            return ActionResponse.success(ssoResult);
        } catch (Exception e) {
            log.error("SSO 登录代理异常: {}", e.getMessage());
            return ActionResponse.error("990027", "认证服务暂时不可用");
        }
    }

    /**
     * 获取当前用户信息
     *
     * 支持两种来源：
     * - Admin 用户：通过 AdminUserService 验证本地 JWT
     * - 普通用户：通过 SsoTokenService 验证 SSO JWT，优先从内存缓存读取完整信息
     *
     * @param request HTTP 请求，包含 X-User-Id 和 Authorization 头
     * @return 用户信息
     */
    @PostMapping("/current")
    public ActionResponse<Object> current(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Login-Id");
        String authHeader = request.getHeader("Authorization");
        String token = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        if (token == null) {
            return ActionResponse.error("990001", "未认证");
        }

        // Admin 用户：本地 JWT 验证
        if ("admin".equalsIgnoreCase(userId) && adminUserService != null) {
            Object adminUser = adminUserService.validateToken(token);
            if (adminUser != null) {
                return ActionResponse.success(adminUser);
            }
            return ActionResponse.error("990001", "认证已过期");
        }

        // 普通用户：SSO JWT 验证
        if (ssoTokenService != null && ssoTokenService.validateToken(token)) {
            Map<String, Object> claims = ssoTokenService.parseToken(token);
            if (claims == null) {
                return ActionResponse.error("990001", "未认证");
            }

            String uid = extractUserId(claims);

            // 优先从内存缓存读取完整用户信息（包含 loginId、avatar 等字段）
            if (uid != null) {
                Map<String, Object> cached = SSO_USER_CACHE.get(uid);
                if (cached != null) {
                    return ActionResponse.success(cached);
                }
            }

            // 缓存不存在（服务重启后），回退到 JWT Claims 并补充缺失字段
            Map<String, Object> userInfo = new HashMap<>(claims);
            if (!userInfo.containsKey("id") && uid != null) {
                userInfo.put("id", uid);
            }
            if (!userInfo.containsKey("loginId") && uid != null) {
                userInfo.put("loginId", uid);
            }
            if (!userInfo.containsKey("name") && uid != null) {
                userInfo.put("name", uid);
            }
            if (!userInfo.containsKey("avatar")) {
                userInfo.put("avatar", "u01");
            }
            return ActionResponse.success(userInfo);
        }

        return ActionResponse.error("990001", "未认证");
    }

    /**
     * 登出
     *
     * @return 登出结果
     */
    @PostMapping("/logout")
    public ActionResponse<Object> logout() {
        return ActionResponse.success("已登出");
    }

    /**
     * 从 SSO 认证结果中提取用户信息，规范化 avatar 字段，缓存到内存
     *
     * SSO 返回结果通常包含 token 和 user 两部分。本方法从 user 部分提取信息，
     * 确保 avatar 为短编号形式，然后将完整的 user 信息缓存。
     */
    @SuppressWarnings("unchecked")
    private void extractAndNormalizeUser(Map<String, Object> ssoResult) {
        if (ssoResult == null) return;

        // SSO 结果中可能直接包含用户字段，也可能嵌套在 "user" 键下
        Map<String, Object> userMap = null;
        Object userObj = ssoResult.get("user");
        if (userObj instanceof Map) {
            userMap = new HashMap<>((Map<String, Object>) userObj);
        } else if (userObj != null) {
            // 非 Map 类型（如 JsonObject、POJO），用 Gson 转换
            String json = MAPPER.writeValueAsString(userObj);
            userMap = MAPPER.readValue(json, MAP_TYPE);
        } else {
            // 如果没有嵌套的 user 对象，将 ssoResult 本身作为用户信息
            userMap = new HashMap<>(ssoResult);
        }

        // 规范化 avatar 为短编号
        Object avatarObj = userMap.get("avatar");
        String avatarId = normalizeAvatarId(avatarObj != null ? avatarObj.toString() : null);
        userMap.put("avatar", avatarId);

        // 提取 userId 用于缓存 key
        String uid = extractUserId(userMap);
        if (uid != null) {
            SSO_USER_CACHE.put(uid, userMap);
        }
    }

    /**
     * 规范化 avatar 为短编号形式
     *
     * 支持的输入格式：
     * - null/空 → "u01"（默认）
     * - 短编号如 "u01"、"admin" → 直接返回
     * - 完整路径如 "/icons/avatar/u01.svg" → 提取 "u01"
     */
    private String normalizeAvatarId(String avatar) {
        if (avatar == null || avatar.trim().isEmpty()) {
            return "u01";
        }
        avatar = avatar.trim();
        // 如果是完整路径，提取编号部分
        if (avatar.contains("/")) {
            int lastSlash = avatar.lastIndexOf('/');
            int dotIndex = avatar.lastIndexOf('.');
            if (dotIndex > lastSlash) {
                return avatar.substring(lastSlash + 1, dotIndex);
            }
            return avatar.substring(lastSlash + 1);
        }
        return avatar;
    }

    /**
     * 从 JWT Claims 或用户信息 Map 中提取用户 ID
     * 兼容多种键名：userId、sub、id
     */
    private String extractUserId(Map<String, Object> claims) {
        if (claims == null) return null;

        Object uid = claims.get("userId");
        if (uid == null) uid = claims.get("sub");
        if (uid == null) uid = claims.get("id");
        return uid != null ? uid.toString() : null;
    }
}
