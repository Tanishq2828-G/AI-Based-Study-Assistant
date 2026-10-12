# Studywise — AI-Based Study Assistant

Full-stack AI study assistant featuring a React frontend, Spring Boot REST API, and MySQL persistence.

---

## Features
- **Document Ingestion**: Upload PDF, DOCX, or TXT study notes (up to 20 MB).
- **AI-Powered Learning Tools**:
  - **Bullet-Point Summaries**: Extract key insights and relationships clearly.
  - **Topic Discovery**: Automatically identifies central concepts across notes.
  - **Context-Aware Q&A Tutor**: Real-time study tutor answering questions grounded strictly in your notes.
  - **Knowledge Quizzes**: Multiple-choice practice questions with detailed explanations.
  - **OpenAI & Offline Heuristic Fallback**: Runs with OpenAI (`gpt-4o-mini`) when `OPENAI_API_KEY` is provided; automatically uses intelligent local linguistic heuristics when no API key is supplied.
- **Modern UI**: Designed with clean workspace navigation, search, study desk, quiz cards, and dark-tinted interactive components.

---

## Tech Stack
- **Frontend**: React 18, Vite 5, Lucide Icons, Modern CSS
- **Backend**: Spring Boot 3.3.5, Java 17+, Spring Data JPA, Apache PDFBox 3.0, Apache POI 5.3
- **Database**: MySQL 8.0+ / 8.4 (with automatic schema migration)
- **Deployment**: Docker multi-stage container, Render, Railway, or unified single JAR

---

## Currently Running Status

Both services are currently active and running on your system:
- **Backend API**: Running on [`http://localhost:8080`](http://localhost:8080) (connected to local MySQL database `study_assistant`)
- **Frontend App**: Running on [`http://localhost:5173`](http://localhost:5173) (proxying `/api` requests to backend on port 8080)

---

## Local Development

### 1. Database (MySQL)
Ensure MySQL is running on port `3306` with the database `study_assistant`:
```sql
CREATE DATABASE IF NOT EXISTS study_assistant;
```

### 2. Backend
Configure database password in `backend/src/main/resources/application.properties` or set environment variable `DB_PASSWORD`:
```bash
cd backend
mvn spring-boot:run
```
Backend will start on port `8080`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [`http://localhost:5173`](http://localhost:5173).

---

## Production Deployment Options

### Option 1: Standalone Unified JAR (Zero-Setup Deployment)
A single executable JAR that serves both the Spring Boot API and the React frontend static assets:
```bash
# On Windows:
deploy.bat

# On Linux / macOS:
chmod +x deploy.sh
./deploy.sh
```
Run the generated JAR:
```bash
java -jar backend/target/study-assistant-1.0.0.jar
```
Open [`http://localhost:8080`](http://localhost:8080) in your browser.

### Option 2: Docker & Docker Compose
To run both the application and a dedicated MySQL 8.4 container in isolated containers:
```bash
docker compose up -d --build
```
The application will be accessible at [`http://localhost:8080`](http://localhost:8080).

### Option 3: Deploy to Cloud (Render / Railway)
- **Render.com**: Connect this GitHub repository. Render automatically reads [`render.yaml`](render.yaml) to provision a MySQL database and deploy the Dockerized web service.
- **Railway.app**: Push this repository to Railway. Railway detects the [`Dockerfile`](Dockerfile) and can provision a managed MySQL database plugin with one click.
