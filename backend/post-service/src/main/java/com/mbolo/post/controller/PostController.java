package com.mbolo.post.controller;

import com.mbolo.post.model.Comment;
import com.mbolo.post.model.Post;
import com.mbolo.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createPost(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Post post) {
        post.setAuthorId(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", postService.createPost(post)));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Post> feed = postService.getFeed(page, size);
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of(
            "content", feed.getContent(),
            "totalElements", feed.getTotalElements(),
            "totalPages", feed.getTotalPages(),
            "currentPage", feed.getNumber(),
            "size", feed.getSize()
        )));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(Map.of("success", true, "data", postService.toggleLike(id, userId)));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Comment comment) {
        comment.setPostId(id);
        comment.setAuthorId(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", postService.addComment(comment)));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<Map<String, Object>> getComments(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(Map.of("success", true, "data", postService.getComments(id, page, size)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePost(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {
        postService.deletePost(id, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Post supprimé"));
    }
}
