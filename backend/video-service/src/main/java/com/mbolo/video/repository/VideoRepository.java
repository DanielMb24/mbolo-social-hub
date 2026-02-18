package com.mbolo.video.repository;

import com.mbolo.video.model.Video;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface VideoRepository extends MongoRepository<Video, String> {
    Page<Video> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Video> findByAuthorIdOrderByCreatedAtDesc(String authorId, Pageable pageable);
}
