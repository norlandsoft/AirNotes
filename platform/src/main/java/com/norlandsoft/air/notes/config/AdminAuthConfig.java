/**
 * Admin 认证过滤器配置
 *
 * 注册 AdminAuthFilter 到所有路径，过滤器内部判断是否拦截。
 * order=0 确保在 SsoAuthFilter（order=1）之前执行。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.config;

import com.norlandsoft.air.notes.admin.service.AdminUserService;
import com.norlandsoft.air.notes.infra.auth.AdminAuthFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminAuthConfig {

    @Bean
    public FilterRegistrationBean<AdminAuthFilter> adminAuthFilter(AdminUserService adminUserService) {
        FilterRegistrationBean<AdminAuthFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new AdminAuthFilter(adminUserService));
        registration.addUrlPatterns("/*");
        registration.setOrder(0);
        return registration;
    }
}
