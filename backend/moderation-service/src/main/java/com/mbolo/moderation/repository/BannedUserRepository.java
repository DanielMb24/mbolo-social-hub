package com.mbolo.moderation.repository;

import com.mbolo.moderation.model.BannedUser;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface BannedUserRepository extends MongoRepository<BannedUser, String> {
    Optional<BannedUser> findByUserId(String userId);
    boolean existsByUserId(String userId);
}
