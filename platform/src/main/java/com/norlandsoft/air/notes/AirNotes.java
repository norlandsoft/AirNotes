/**
 * AirNotes 应用入口
 *
 * Wiki 知识库服务主启动类。framework-sdk 的 SSO 自动配置通过
 * @ConditionalOnProperty(framework.address) 控制，仅在配置了
 * Framework 服务地址时激活。
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes;

import com.norlandsoft.air.framework.sdk.app.AppManager;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class AirNotes {

    public static void main(String[] args) {
        String workspace = AppManager.getApplicationWorkspace();

        // 设置日志目录
        System.setProperty("log.path", workspace + File.separator + "logs");
        System.setProperty("log.name", "air-notes");
        System.setProperty("log.level", "debug");

        SpringApplication.run(AirNotes.class, args);
    }
}
