# Multi-stage build for Studywise full-stack application

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Spring Boot backend with embedded frontend assets
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY backend/src ./src
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static
RUN mvn clean package -DskipTests

# Stage 3: Minimal Production Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/backend/target/*.jar app.jar
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/materials || exit 1
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
