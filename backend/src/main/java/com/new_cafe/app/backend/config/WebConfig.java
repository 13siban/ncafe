package com.new_cafe.app.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

// CORS 설정 및 정적 리소스 서빙을 위한 configuration
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*") // BFF 패턴이므로 모든 출처 허용 (보안은 BFF 레이어에서 처리)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 로컬 upload 폴더(프로젝트 루트 하위 upload)를 /upload/** 로 매핑
        Path uploadDir = Paths.get("upload");
        String uploadPath = uploadDir.toFile().getAbsolutePath();
        
        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
