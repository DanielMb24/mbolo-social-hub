package com.mbolo.user.controller;

import com.mbolo.user.dto.ApiResponse;
import com.mbolo.user.dto.PublicUserProfile;
import com.mbolo.user.dto.UpdateProfileRequest;
import com.mbolo.user.model.UserProfile;
import com.mbolo.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
    public ResponseEntity<ApiResponse<PublicUserProfile>> getProfile(@PathVariable String id) {
        return userService.getProfile(id)
                .map(p -> ResponseEntity.ok(ApiResponse.ok(PublicUserProfile.from(p))))
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
            @RequestHeader("X-User-Id") String currentUserId,
            @RequestBody UpdateProfileRequest request) {
        if (!currentUserId.equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action interdite");
        }
        return ResponseEntity.ok(ApiResponse.ok(userService.updateProfile(id, request)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<PublicUserProfile>>> search(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(userService.searchUsers(q).stream()
                .map(PublicUserProfile::from)
                .toList()));
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
    public ResponseEntity<ApiResponse<List<PublicUserProfile>>> getFollowers(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getFollowers(userId).stream()
                .map(PublicUserProfile::from)
                .toList()));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<ApiResponse<List<PublicUserProfile>>> getFollowing(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getFollowing(userId).stream()
                .map(PublicUserProfile::from)
                .toList()));
    }

    @GetMapping("/{userId}/is-following")
    public ResponseEntity<ApiResponse<Boolean>> isFollowing(
            @RequestHeader("X-User-Id") String followerId,
            @PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.isFollowing(followerId, userId)));
    }
}
