package com.mbolo.video.service;

import com.mbolo.video.model.Video;
import com.mbolo.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VideoService {

    private final VideoRepository videoRepository;

    public Video createVideo(Video video) {
        return videoRepository.save(video);
    }

    public Page<Video> getFeed(int page, int size) {
        return videoRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    public Video toggleLike(String videoId, String userId) {
        Video video = videoRepository.findById(videoId).orElseThrow();
        if (video.getLikes().contains(userId)) {
            video.getLikes().remove(userId);
        } else {
            video.getLikes().add(userId);
        }
        return videoRepository.save(video);
    }

    public Video incrementViews(String videoId) {
        Video video = videoRepository.findById(videoId).orElseThrow();
        video.setViews(video.getViews() + 1);
        return videoRepository.save(video);
    }
}
