package com.mbolo.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/chat/**")
                .addResourceLocations("file:/tmp/uploads/chat/")
                .setCachePeriod(3600)
                .resourceChain(true);
    }
    
    // CORS entièrement géré par l'API Gateway - aucune config CORS ici
    // pour éviter le doublon Access-Control-Allow-Origin
}
