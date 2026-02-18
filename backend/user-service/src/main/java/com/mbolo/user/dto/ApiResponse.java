package com.mbolo.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;

    public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(true, data, "OK"); }
    public static <T> ApiResponse<T> error(String msg) { return new ApiResponse<>(false, null, msg); }
}
