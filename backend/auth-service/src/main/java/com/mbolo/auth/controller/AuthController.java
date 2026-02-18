package com.mbolo.auth.controller;

import com.mbolo.auth.dto.*;
import com.mbolo.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(response.getMessage()));
        }
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(401).body(ApiResponse.error(response.getMessage()));
        }
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestParam String token) {
        AuthResponse response = authService.refreshToken(token);
        if (!response.isSuccess()) {
            return ResponseEntity.status(401).body(ApiResponse.error(response.getMessage()));
        }
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
