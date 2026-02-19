package com.mbolo.user.controller;

import com.mbolo.user.dto.ApiResponse;
import com.mbolo.user.dto.UpdateProfileRequest;
import com.mbolo.user.model.UserProfile;
import com.mbolo.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfile>> getMe(@RequestHeader("X-User-Id") String userId) {
        return userService.getProfile(userId)
                .map(p -> ResponseEntity.ok(ApiResponse.ok(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserProfile>> getProfile(@PathVariable String id) {
        return userService.getProfile(id)
                .map(p -> ResponseEntity.ok(ApiResponse.ok(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfile>> updateProfile(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(userService.updateProfile(userId, request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserProfile>> updateProfileById(
            @PathVariable String id,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(userService.updateProfile(id, request)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserProfile>>> search(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(userService.searchUsers(q)));
    }

    @PostMapping("/block/{blockedId}")
    public ResponseEntity<ApiResponse<String>> blockUser(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String blockedId) {
        userService.blockUser(userId, blockedId);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur bloqué"));
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<ApiResponse<String>> followUser(
            @RequestHeader("X-User-Id") String followerId,
            @PathVariable String userId) {
        userService.followUser(followerId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur suivi"));
    }

    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<ApiResponse<String>> unfollowUser(
            @RequestHeader("X-User-Id") String followerId,
            @PathVariable String userId) {
        userService.unfollowUser(followerId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Désabonné"));
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<ApiResponse<List<UserProfile>>> getFollowers(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getFollowers(userId)));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<ApiResponse<List<UserProfile>>> getFollowing(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getFollowing(userId)));
    }

    @GetMapping("/{userId}/is-following")
    public ResponseEntity<ApiResponse<Boolean>> isFollowing(
            @RequestHeader("X-User-Id") String followerId,
            @PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.isFollowing(followerId, userId)));
    }
}
