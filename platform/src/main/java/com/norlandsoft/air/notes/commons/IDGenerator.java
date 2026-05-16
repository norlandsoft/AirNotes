package com.norlandsoft.air.notes.commons;

import cn.hutool.core.lang.id.NanoId;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Objects;

public class IDGenerator {
  private static final int SHORT_ID_LENGTH = 12;

  private static final String[] CHARS = new String[]{"a", "b", "c", "d", "e", "f",
      "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s",
      "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5",
      "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I",
      "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",
      "W", "X", "Y", "Z"};

  private static final char[] DEFAULT_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".toCharArray();

  public static String UUID() {
    return java.util.UUID.randomUUID().toString();
  }

  public static String shortID() {
    return NanoId.randomNanoId(null, DEFAULT_ALPHABET, SHORT_ID_LENGTH);
  }

  public static String renewShortID(String originalId) {
    if (originalId == null || originalId.trim().isEmpty()) {
      return null;
    }

    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(originalId.getBytes(StandardCharsets.UTF_8));
      return convertHashToShortID(hash, SHORT_ID_LENGTH);
    } catch (NoSuchAlgorithmException e) {
      try {
        MessageDigest md5Digest = MessageDigest.getInstance("MD5");
        byte[] hash = md5Digest.digest(originalId.getBytes(StandardCharsets.UTF_8));
        return convertHashToShortID(hash, SHORT_ID_LENGTH);
      } catch (NoSuchAlgorithmException ex) {
        throw new RuntimeException("无法创建哈希算法", ex);
      }
    }
  }

  private static String convertHashToShortID(byte[] hash, int length) {
    StringBuilder result = new StringBuilder();

    long seed = 0;
    for (int i = 0; i < Math.min(hash.length, 8); i++) {
      seed = (seed << 8) | (hash[i] & 0xFF);
    }

    for (int i = 0; i < length; i++) {
      seed = (seed * 1103515245L + 12345L) & 0x7FFFFFFFFFFFFFFFL;
      int index = (int) (seed % CHARS.length);
      result.append(CHARS[index]);
    }

    return result.toString();
  }

  public static String sessionId() {
    return Objects.requireNonNull(CryptoUtils.md5(UUID())).toLowerCase();
  }

  public static String salt() {
    return CryptoUtils.sha256(UUID());
  }
}
