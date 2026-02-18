package com.mbolo.post.service;

import com.mbolo.post.model.Comment;
import com.mbolo.post.model.Post;
import com.mbolo.post.repository.CommentRepository;
import com.mbolo.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    public Post createPost(Post post) {
        return postRepository.save(post);
    }

    public Page<Post> getFeed(int page, int size) {
        return postRepository.findByDeletedFalseOrderByCreatedAtDesc(
            PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public Page<Post> getUserPosts(String authorId, int page, int size) {
        return postRepository.findByAuthorIdAndDeletedFalseOrderByCreatedAtDesc(
            authorId, PageRequest.of(page, size));
    }

    public Post toggleLike(String postId, String userId) {
        Post post = postRepository.findById(postId).orElseThrow();
        if (post.getLikes().contains(userId)) {
            post.getLikes().remove(userId);
        } else {
            post.getLikes().add(userId);
        }
        return postRepository.save(post);
    }

    public Comment addComment(Comment comment) {
        Comment saved = commentRepository.save(comment);
        postRepository.findById(comment.getPostId()).ifPresent(post -> {
            post.setCommentsCount((int) commentRepository.countByPostId(post.getId()));
            postRepository.save(post);
        });
        return saved;
    }

    public Page<Comment> getComments(String postId, int page, int size) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId, PageRequest.of(page, size));
    }

    public void deletePost(String postId, String userId) {
        postRepository.findById(postId).ifPresent(post -> {
            if (post.getAuthorId().equals(userId)) {
                post.setDeleted(true);
                postRepository.save(post);
            }
        });
    }
}
