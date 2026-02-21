package com.mbolo.chat.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class FileStorageInit {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageInit.class);

    @PostConstruct
    public void init() {
        try {
            Path uploadDir = Paths.get("/tmp/uploads/chat");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
                logger.info("Dossier uploads créé: {}", uploadDir.toAbsolutePath());
            }
        } catch (IOException e) {
            logger.error("Impossible de créer le dossier uploads: {}", e.getMessage());
        }
    }
}
