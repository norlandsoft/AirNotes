package com.norlandsoft.air.notes.admin.controller;

import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.framework.sdk.app.AppManager;
import com.norlandsoft.air.framework.sdk.storage.EmbeddedStorage;
import com.norlandsoft.air.framework.sdk.util.CryptoUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.security.SecureRandom;

/**
 * 初始化 admin 密码控制器
 *
 * 提供 admin 密码初始化接口，仅在首次初始化时可用；
 * 若密码文件已存在则无法重置。密码保存到工作目录 secret/password，
 * 并写入嵌入式存储供后续 admin 登录与 session 管理使用。
 *
 * 访问：GET /initialAdminPassword
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
@RestController
@RequestMapping("/")
@Slf4j
public class InitialAdminPasswordController {

  private static final String ADMIN_PASSWORD_KEY = "admin.password";
  private static final String SECRET_DIR = "secret";
  private static final String PASSWORD_FILE = "password";

  /**
   * 初始化 admin 密码
   *
   * 检查 workspace/secret/password 是否存在；不存在则生成随机密码，
   * 写入文件并存入嵌入式存储；存在则返回错误。
   */
  @GetMapping("/initialAdminPassword")
  public ActionResponse<String> initialAdminPassword() {
    try {
      String workspace = AppManager.getApplicationWorkspace();
      String secretDirPath = workspace + File.separator + SECRET_DIR;
      File secretDir = new File(secretDirPath);
      String passwordFilePath = secretDirPath + File.separator + PASSWORD_FILE;
      File passwordFile = new File(passwordFilePath);

      if (passwordFile.exists() && passwordFile.isFile()) {
        log.warn("admin 密码文件已存在，无法重新初始化。文件路径: {}", passwordFilePath);
        return ActionResponse.error("990019", "admin 密码已初始化，无法重新设置。如需重置，请删除密码文件后重试。");
      }

      String randomPassword = generateRandomPassword(16);
      String encryptedPassword = CryptoUtils.sha256(randomPassword);

      if (!secretDir.exists()) {
        if (!secretDir.mkdirs()) {
          log.error("无法创建 secret 目录: {}", secretDirPath);
          return ActionResponse.error("990020", "无法创建 secret 目录");
        }
      }

      try (FileWriter writer = new FileWriter(passwordFile)) {
        writer.write(randomPassword);
        writer.flush();
      } catch (IOException e) {
        log.error("保存密码文件失败: {}", passwordFilePath, e);
        return ActionResponse.error("990021", "保存密码文件失败: " + e.getMessage());
      }

      // 非 Windows 环境设置文件权限为仅所有者可读写
      try {
        if (!System.getProperty("os.name", "").toLowerCase().contains("windows")) {
          passwordFile.setReadable(false, false);
          passwordFile.setReadable(true, true);
          passwordFile.setWritable(false, false);
          passwordFile.setWritable(true, true);
          passwordFile.setExecutable(false, false);
        }
      } catch (Exception e) {
        log.warn("设置密码文件权限失败（不影响功能）: {}", e.getMessage());
      }

      boolean storageOk = EmbeddedStorage.getInstance().put(ADMIN_PASSWORD_KEY, encryptedPassword);
      if (!storageOk) {
        log.warn("密码文件已保存，但嵌入式存储保存失败，请检查存储状态");
      }

      log.info("admin 密码初始化成功，密码文件已保存: {}", passwordFilePath);
      return ActionResponse.success(randomPassword, "admin 密码初始化成功，请妥善保管密码");

    } catch (Exception e) {
      log.error("初始化 admin 密码失败", e);
      return ActionResponse.error("990022", "初始化 admin 密码失败: " + e.getMessage());
    }
  }

  /**
   * 生成包含大小写字母和数字的随机密码
   */
  private String generateRandomPassword(int length) {
    String upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    String lowerCase = "abcdefghijklmnopqrstuvwxyz";
    String numbers = "0123456789";
    String allChars = upperCase + lowerCase + numbers;

    SecureRandom random = new SecureRandom();
    StringBuilder password = new StringBuilder(length);
    // 确保至少包含一个大写、小写和数字
    password.append(upperCase.charAt(random.nextInt(upperCase.length())));
    password.append(lowerCase.charAt(random.nextInt(lowerCase.length())));
    password.append(numbers.charAt(random.nextInt(numbers.length())));
    for (int i = 3; i < length; i++) {
      password.append(allChars.charAt(random.nextInt(allChars.length())));
    }

    // Fisher-Yates 洗牌
    char[] arr = password.toString().toCharArray();
    for (int i = arr.length - 1; i > 0; i--) {
      int j = random.nextInt(i + 1);
      char t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return new String(arr);
  }
}
