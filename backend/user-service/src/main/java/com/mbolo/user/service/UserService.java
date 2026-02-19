package com.mbolo.user.service;

import com.mbolo.user.dto.UpdateProfileRequest;
import com.mbolo.user.model.UserFollow;
import com.mbolo.user.model.UserProfile;
import com.mbolo.user.repository.UserFollowRepository;
import com.mbolo.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserProfileRepository repository;
    private final UserFollowRepository followRepository;

    public UserProfile createProfile(String userId, String fullname) {
        UserProfile profile = new UserProfile();
        profile.setId(userId);
        profile.setFullname(fullname);
        return repository.save(profile);
    }

    public Optional<UserProfile> getProfile(String userId) {
        return repository.findById(userId);
    }

    public UserProfile updateProfile(String userId, UpdateProfileRequest request) {
        UserProfile profile = repository.findById(userId).orElseGet(() -> {
            // Create new profile if it doesn't exist
            UserProfile newProfile = new UserProfile();
            newProfile.setId(userId);
            return newProfile;
        });
        
        if (request.getUsername() != null) profile.setUsername(request.getUsername());
        if (request.getEmail() != null) profile.setEmail(request.getEmail());
        if (request.getFullname() != null) profile.setFullname(request.getFullname());
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getLocation() != null) profile.setLocation(request.getLocation());
        return repository.save(profile);
    }

    public List<UserProfile> searchUsers(String query) {
        return repository.findByFullnameContainingIgnoreCase(query);
    }

    public void blockUser(String userId, String blockedId) {
        UserProfile profile = repository.findById(userId).orElseThrow();
        if (!profile.getBlockedUsers().contains(blockedId)) {
            profile.getBlockedUsers().add(blockedId);
            repository.save(profile);
        }
    }

    @Transactional
    public void followUser(String followerId, String followingId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        // Check if already following
        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            return;
        }

        // Create follow relationship
        UserFollow follow = new UserFollow();
        follow.setFollowerId(followerId);
        follow.setFollowingId(followingId);
        followRepository.save(follow);

        // Update counts
        updateFollowCounts(followerId, followingId);
    }

    @Transactional
    public void unfollowUser(String followerId, String followingId) {
        followRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
        updateFollowCounts(followerId, followingId);
    }

    public boolean isFollowing(String followerId, String followingId) {
        return followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    public List<UserProfile> getFollowers(String userId) {
        List<UserFollow> follows = followRepository.findByFollowingId(userId);
        List<String> followerIds = follows.stream()
                .map(UserFollow::getFollowerId)
                .collect(Collectors.toList());
        return repository.findAllById(followerIds);
    }

    public List<UserProfile> getFollowing(String userId) {
        List<UserFollow> follows = followRepository.findByFollowerId(userId);
        List<String> followingIds = follows.stream()
                .map(UserFollow::getFollowingId)
                .collect(Collectors.toList());
        return repository.findAllById(followingIds);
    }

    private void updateFollowCounts(String followerId, String followingId) {
        // Update follower's following count
        repository.findById(followerId).ifPresent(profile -> {
            profile.setFollowingCount((int) followRepository.countByFollowerId(followerId));
            repository.save(profile);
        });

        // Update following's followers count
        repository.findById(followingId).ifPresent(profile -> {
            profile.setFollowersCount((int) followRepository.countByFollowingId(followingId));
            repository.save(profile);
        });
    }
}
