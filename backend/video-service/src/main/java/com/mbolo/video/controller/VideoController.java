package com.mbolo.video.controller;

import com.mbolo.video.model.Video;
import com.mbolo.video.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createVideo(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Video video) {
        video.setAuthorId(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", videoService.createVideo(video)));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Video> feed = videoService.getFeed(page, size);
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of(
            "content", feed.getContent(),
            "totalElements", feed.getTotalElements(),
            "totalPages", feed.getTotalPages()
        )));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(Map.of("success", true, "data", videoService.toggleLike(id, userId)));
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Map<String, Object>> incrementViews(@PathVariable String id) {
        return ResponseEntity.ok(Map.of("success", true, "data", videoService.incrementViews(id)));
    }
}
