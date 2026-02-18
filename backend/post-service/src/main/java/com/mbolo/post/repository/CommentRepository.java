package com.mbolo.post.repository;

import com.mbolo.post.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CommentRepository extends MongoRepository<Comment, String> {
    Page<Comment> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable);
    long countByPostId(String postId);
}
