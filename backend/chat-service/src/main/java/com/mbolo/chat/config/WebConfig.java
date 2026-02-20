package com.mbolo.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Servir les fichiers du dossier /tmp/uploads/chat via /uploads/chat/**
        registry.addResourceHandler("/uploads/chat/**")
                .addResourceLocations("file:/tmp/uploads/chat/")
                .setCachePeriod(3600) // Cache de 1 heure
                .resourceChain(true);
    }
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Permettre l'accès CORS aux fichiers uploadés
        registry.addMapping("/uploads/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:8080")
                .allowedMethods("GET", "HEAD")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
