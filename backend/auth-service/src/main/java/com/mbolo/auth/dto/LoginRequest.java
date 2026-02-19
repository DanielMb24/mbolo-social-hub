package com.mbolo.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String username; // Peut être phone, email ou username
    @NotBlank
    private String password;
}
