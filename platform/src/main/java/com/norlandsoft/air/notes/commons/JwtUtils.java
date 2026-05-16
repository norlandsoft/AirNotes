package com.norlandsoft.air.notes.commons;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

public class JwtUtils {

  private static final String SECRET = "AirNotes-Wiki-Service-Secret-Key-2026";
  private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
  private static final long EXPIRE_MS = 7200000L; // 2 hours

  public static String generateToken(String userId, String name, String role) {
    return Jwts.builder()
        .subject(userId)
        .claim("name", name)
        .claim("role", role)
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + EXPIRE_MS))
        .signWith(KEY)
        .compact();
  }

  public static Claims parseToken(String token) {
    return Jwts.parser()
        .verifyWith(KEY)
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  public static boolean validate(String token) {
    try {
      Claims claims = parseToken(token);
      return claims.getExpiration().after(new Date());
    } catch (Exception e) {
      return false;
    }
  }
}
