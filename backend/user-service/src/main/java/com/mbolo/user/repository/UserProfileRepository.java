package com.mbolo.user.repository;

import com.mbolo.user.model.UserProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface UserProfileRepository extends MongoRepository<UserProfile, String> {
    List<UserProfile> findByFullnameContainingIgnoreCase(String query);
    Optional<UserProfile> findByUsername(String username);
}
