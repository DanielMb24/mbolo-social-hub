package com.mbolo.user.repository;

import com.mbolo.user.model.UserProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface UserProfileRepository extends MongoRepository<UserProfile, String> {
    List<UserProfile> findByFullnameContainingIgnoreCase(String query);
}
