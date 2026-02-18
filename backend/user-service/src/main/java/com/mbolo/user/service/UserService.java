package com.mbolo.user.service;

import com.mbolo.user.dto.UpdateProfileRequest;
import com.mbolo.user.model.UserProfile;
import com.mbolo.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserProfileRepository repository;

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
        UserProfile profile = repository.findById(userId).orElseThrow();
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
}
