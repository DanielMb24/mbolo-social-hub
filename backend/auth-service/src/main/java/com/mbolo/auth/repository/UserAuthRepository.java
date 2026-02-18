package com.mbolo.auth.repository;

import com.mbolo.auth.model.UserAuth;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserAuthRepository extends MongoRepository<UserAuth, String> {
    Optional<UserAuth> findByPhone(String phone);
    boolean existsByPhone(String phone);
}
