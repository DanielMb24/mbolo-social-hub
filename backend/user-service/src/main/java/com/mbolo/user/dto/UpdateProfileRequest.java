package com.mbolo.user.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullname;
    private String bio;
    private String location;
}
