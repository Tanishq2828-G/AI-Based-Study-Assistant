package com.studywise.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:}")
    private String springUrl;

    @Value("${DB_URL:}")
    private String envDbUrl;

    @Value("${DATABASE_URL:}")
    private String envDatabaseUrl;

    @Value("${spring.datasource.username:root}")
    private String defaultUsername;

    @Value("${spring.datasource.password:Tanishq@28}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawUrl = null;
        if (envDatabaseUrl != null && !envDatabaseUrl.isBlank()) {
            rawUrl = envDatabaseUrl.trim();
        } else if (envDbUrl != null && !envDbUrl.isBlank()) {
            rawUrl = envDbUrl.trim();
        } else if (springUrl != null && !springUrl.isBlank()) {
            rawUrl = springUrl.trim();
        }

        HikariConfig config = new HikariConfig();

        if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(rawUrl);
                String userInfo = uri.getUserInfo();
                String username = defaultUsername;
                String password = defaultPassword;
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String dbName = uri.getPath();
                if (dbName != null && dbName.startsWith("/")) {
                    dbName = dbName.substring(1);
                }
                String query = uri.getQuery() != null ? "?" + uri.getQuery() : "";
                String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + "/" + dbName + query;

                config.setJdbcUrl(jdbcUrl);
                config.setUsername(username);
                config.setPassword(password);
                config.setDriverClassName("org.postgresql.Driver");
                return new HikariDataSource(config);
            } catch (Exception ignored) {
                // fallback to default below
            }
        }

        if (rawUrl != null && rawUrl.startsWith("jdbc:postgresql:")) {
            config.setJdbcUrl(rawUrl);
            config.setUsername(defaultUsername);
            config.setPassword(defaultPassword);
            config.setDriverClassName("org.postgresql.Driver");
            return new HikariDataSource(config);
        }

        String finalUrl = (rawUrl != null && !rawUrl.isBlank())
                ? rawUrl
                : "jdbc:mysql://localhost:3306/study_assistant?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";

        config.setJdbcUrl(finalUrl);
        config.setUsername(defaultUsername);
        config.setPassword(defaultPassword);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        return new HikariDataSource(config);
    }
}
