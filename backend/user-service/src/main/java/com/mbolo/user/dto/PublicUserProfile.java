package com.mbolo.user.dto;

import com.mbolo.user.model.UserProfile;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class PublicUserProfile {
    private String id;
    private String username;
    private String fullname;
    private String avatarUrl;
    private String bio;
    private String location;
    private int followersCount;
    private int followingCount;
    private Instant createdAt;

    public static PublicUserProfile from(UserProfile profile) {
        return PublicUserProfile.builder()
                .id(profile.getId())
                .username(profile.getUsername())
                .fullname(profile.getFullname())
                .avatarUrl(profile.getAvatarUrl())
                .bio(profile.getBio())
                .location(profile.getLocation())
                .followersCount(profile.getFollowersCount())
                .followingCount(profile.getFollowingCount())
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
