package com.mbolo.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private boolean success;
    private String accessToken;
    private String refreshToken;
    private String userId;
    private String message;
}
