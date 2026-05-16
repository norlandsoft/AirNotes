package com.norlandsoft.air.notes.commons;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class CryptoUtils {
  private static final int READ_BUFFER_SIZE = 1024;

  private static final Base64.Decoder DECODER = Base64.getDecoder();
  private static final Base64.Encoder ENCODER = Base64.getEncoder();

  private static final String CIPHER_ALGORITHM = "AES/ECB/PKCS5Padding";
  private static final String KEY_ALGORITHM = "AES";

  public static String md5(String input) {
    char[] hexDigits = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};
    try {
      byte[] btInput = input.getBytes();
      MessageDigest mdInst = MessageDigest.getInstance("MD5");
      mdInst.update(btInput);
      byte[] md = mdInst.digest();
      int j = md.length;
      char[] str = new char[j * 2];
      int k = 0;
      for (byte byte0 : md) {
        str[k++] = hexDigits[byte0 >>> 4 & 0xf];
        str[k++] = hexDigits[byte0 & 0xf];
      }
      return new String(str);
    } catch (Exception e) {
      return null;
    }
  }

  public static String sha256(String str) {
    MessageDigest messageDigest;
    String encodestr = "";
    try {
      messageDigest = MessageDigest.getInstance("SHA-256");
      messageDigest.update(str.getBytes(StandardCharsets.UTF_8));
      encodestr = byte2Hex(messageDigest.digest());
    } catch (NoSuchAlgorithmException e) {
      return null;
    }
    return encodestr;
  }

  public static String Base64Decode2UTFString(String in) {
    return new String(DECODER.decode(in), StandardCharsets.UTF_8);
  }

  public static String Base64Encode(String text) {
    return ENCODER.encodeToString(text.getBytes(StandardCharsets.UTF_8));
  }

  public static String Base64Encode(byte[] bytes) {
    return ENCODER.encodeToString(bytes);
  }

  private static String byte2Hex(byte[] bytes) {
    StringBuilder stringBuffer = new StringBuilder();
    String temp = null;
    for (byte aByte : bytes) {
      temp = Integer.toHexString(aByte & 0xFF);
      if (temp.length() == 1) {
        stringBuffer.append("0");
      }
      stringBuffer.append(temp);
    }
    return stringBuffer.toString();
  }
}
