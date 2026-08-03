package com.mbolo.user.service;

import com.mbolo.user.dto.UpdateProfileRequest;
import com.mbolo.user.model.UserFollow;
import com.mbolo.user.model.UserProfile;
import com.mbolo.user.repository.UserFollowRepository;
import com.mbolo.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

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

        if (request.getUsername() != null) {
            String username = cleanUsername(request.getUsername());
            repository.findByUsername(username)
                    .filter(existing -> !existing.getId().equals(userId))
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(CONFLICT, "Nom d'utilisateur déjà utilisé");
                    });
            profile.setUsername(username);
        }
        if (request.getFullname() != null) profile.setFullname(cleanText(request.getFullname(), "Nom complet", 1, 80));
        if (request.getBio() != null) profile.setBio(cleanText(request.getBio(), "Bio", 0, 300));
        if (request.getLocation() != null) profile.setLocation(cleanText(request.getLocation(), "Localisation", 0, 80));
        return repository.save(profile);
    }

    public List<UserProfile> searchUsers(String query) {
        String safeQuery = cleanText(query == null ? "" : query, "Recherche", 0, 50);
        return repository.findByFullnameContainingIgnoreCase(safeQuery);
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
            throw new ResponseStatusException(BAD_REQUEST, "Vous ne pouvez pas vous suivre vous-même");
        }

        if (!repository.existsById(followingId)) {
            throw new ResponseStatusException(NOT_FOUND, "Utilisateur introuvable");
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

    private String cleanText(String value, String field, int min, int max) {
        String text = value == null ? "" : value.trim();
        if (text.length() < min || text.length() > max) {
            throw new ResponseStatusException(BAD_REQUEST, field + " invalide");
        }
        return text;
    }

    private String cleanUsername(String value) {
        String username = cleanText(value, "Nom d'utilisateur", 3, 30);
        if (!username.matches("^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$")) {
            throw new ResponseStatusException(BAD_REQUEST, "Nom d'utilisateur invalide");
        }
        return username;
    }
}
