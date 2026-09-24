package com.rishav.behindthecode.service;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey secretKey;

    private final long expirationTime =
            1000L * 60 * 60 * 24;

    public JwtService(
            @Value("${JWT_SECRET}") String secret
    ) {
        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generateToken(
            String username,
            String role
    ) {
        Date now = new Date();

        Date expiration = new Date(
                now.getTime() + expirationTime
        );

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secretKey)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token)
                .getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token)
                .get("role", String.class);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}