package com.studywise.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
@Configuration public class WebConfig implements WebMvcConfigurer {
 @Value("${app.frontend-origin:http://localhost:5173}") private String origin;
 @Override public void addCorsMappings(CorsRegistry registry){registry.addMapping("/api/**").allowedOrigins(origin).allowedMethods("GET","POST","DELETE","OPTIONS").allowedHeaders("*");}
}
