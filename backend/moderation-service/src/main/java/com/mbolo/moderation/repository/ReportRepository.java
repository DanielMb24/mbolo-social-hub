package com.mbolo.moderation.repository;

import com.mbolo.moderation.model.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReportRepository extends MongoRepository<Report, String> {
    Page<Report> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
