package com.mbolo.user.repository;

import com.mbolo.user.model.UserFollow;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFollowRepository extends MongoRepository<UserFollow, String> {
    Optional<UserFollow> findByFollowerIdAndFollowingId(String followerId, String followingId);
    
    List<UserFollow> findByFollowerId(String followerId);
    
    List<UserFollow> findByFollowingId(String followingId);
    
    long countByFollowerId(String followerId);
    
    long countByFollowingId(String followingId);
    
    void deleteByFollowerIdAndFollowingId(String followerId, String followingId);
    
    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);
}
