package com.rishav.behindthecode.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rishav.behindthecode.entity.User;
import com.rishav.behindthecode.service.JwtService;
import com.rishav.behindthecode.service.UserService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "http://localhost:5174",
                "https://blog.rishavkamal.com"
        }
)
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(
            UserService userService,
            JwtService jwtService
    ) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request
    ) {
        User user = userService.findByUsername(
                request.username()
        );

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        boolean passwordMatches =
                userService.verifyPassword(
                        request.password(),
                        user.getPassword()
                );

        if (!passwordMatches) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        String token = jwtService.generateToken(
                user.getUsername(),
                user.getRole()
        );

        return ResponseEntity.ok(
                new LoginResponse(
                        token,
                        user.getUsername(),
                        user.getRole()
                )
        );
    }

    public record LoginRequest(
            String username,
            String password
    ) {
    }

    public record LoginResponse(
            String token,
            String username,
            String role
    ) {
    }
}