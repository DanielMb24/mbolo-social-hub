package com.mbolo.user.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String username;
    private String email;
    private String fullname;
    private String bio;
    private String location;
}
