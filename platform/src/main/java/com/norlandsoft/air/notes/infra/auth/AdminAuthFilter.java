/**
 * Admin 认证过滤器
 *
 * 拦截 /admin/** 和 /rest/** 路径，验证 Admin 用户的 JWT token。
 * 验证成功后将用户信息注入到 request attribute "adminUser"。
 *
 * 设计思路：
 * 1. /admin/** 路径：强制要求 Admin 认证（排除登录端点）
 * 2. /rest/** 路径：仅当 X-User-Login-Id 为 admin 时验证 JWT，设置 adminUser 属性，
 *    使后续的 SsoAuthFilter 检测到该属性后跳过 SSO 验证
 * 3. 非 admin 用户访问 /rest/** 路径时直接放行，由 SsoAuthFilter 处理
 * 4. 本过滤器 order=0，确保在 SsoAuthFilter（order=1）之前执行
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.infra.auth;

import com.norlandsoft.air.notes.admin.service.AdminUserService;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Set;

public class AdminAuthFilter implements Filter {

    /** /admin/** 路径下的公开端点，无需认证 */
    private static final Set<String> ADMIN_EXCLUDED_PATHS = Set.of(
        "/admin/user/login"
    );

    private final AdminUserService adminUserService;

    public AdminAuthFilter(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        String contextPath = httpRequest.getContextPath();
        if (contextPath != null && !contextPath.isEmpty()) {
            path = path.substring(contextPath.length());
        }

        boolean isAdminPath = path.startsWith("/admin/");
        boolean isRestPath = path.startsWith("/rest/");

        // 非目标路径直接放行
        if (!isAdminPath && !isRestPath) {
            chain.doFilter(request, response);
            return;
        }

        // /admin/** 公开端点排除
        if (isAdminPath && ADMIN_EXCLUDED_PATHS.contains(path)) {
            chain.doFilter(request, response);
            return;
        }

        // /rest/** 路径：仅当请求头标识为 admin 用户时处理，否则交给 SsoAuthFilter
        if (isRestPath) {
            handleRestPath(httpRequest, httpResponse, chain);
            return;
        }

        // 以下处理 /admin/** 路径
        handleAdminPath(httpRequest, httpResponse, chain);
    }

    /**
     * 处理 /rest/** 路径请求
     * 仅当 X-User-Login-Id 为 admin 时尝试验证 JWT，设置 adminUser 属性供 SsoAuthFilter 跳过验证。
     * 非 admin 用户或验证失败时直接放行，由 SsoAuthFilter 接管。
     */
    private void handleRestPath(HttpServletRequest httpRequest, HttpServletResponse httpResponse,
                                FilterChain chain) throws IOException, ServletException {
        String userId = httpRequest.getHeader("X-User-Login-Id");
        if (!"admin".equalsIgnoreCase(userId)) {
            chain.doFilter(httpRequest, httpResponse);
            return;
        }

        String token = extractToken(httpRequest);
        if (token != null) {
            try {
                Object adminUser = adminUserService.validateToken(token);
                if (adminUser != null) {
                    httpRequest.setAttribute("adminUser", adminUser);
                }
            } catch (Exception e) {
                // Admin token 验证失败，交给后续过滤器处理
            }
        }
        // 无论验证是否成功，都放行到下一个过滤器
        chain.doFilter(httpRequest, httpResponse);
    }

    /**
     * 处理 /admin/** 路径请求
     * 强制要求 admin JWT 认证，验证失败直接返回 401。
     */
    private void handleAdminPath(HttpServletRequest httpRequest, HttpServletResponse httpResponse,
                                 FilterChain chain) throws IOException, ServletException {
        String userId = httpRequest.getHeader("X-User-Login-Id");
        String token = extractToken(httpRequest);

        if (token == null || userId == null) {
            sendUnauthorized(httpResponse, "未提供认证信息");
            return;
        }

        if (!"admin".equalsIgnoreCase(userId)) {
            sendUnauthorized(httpResponse, "非管理员用户");
            return;
        }

        try {
            Object adminUser = adminUserService.validateToken(token);
            if (adminUser == null) {
                sendUnauthorized(httpResponse, "认证已过期");
                return;
            }

            httpRequest.setAttribute("adminUser", adminUser);
            chain.doFilter(httpRequest, httpResponse);
        } catch (Exception e) {
            sendUnauthorized(httpResponse, "认证验证失败");
        }
    }

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
            "{\"success\":false,\"code\":\"990001\",\"message\":\"" + message + "\"}"
        );
    }
}
