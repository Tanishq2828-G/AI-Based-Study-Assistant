<<<<<<< HEAD
# Studywise

Full-stack AI study assistant: React frontend, Spring Boot REST API, and MySQL persistence.

## Run
Requirements: Java 17+, Maven, Node 20+, and MySQL 8.

1. Start MySQL with database `study_assistant` (or run `docker compose up -d mysql`; the compose profile uses local password `studywise-local`).
2. In `backend`, run `mvn spring-boot:run`. Defaults use `root` with an empty password; for the compose profile set `DB_PASSWORD=studywise-local`. Configure `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` as needed.
3. In `frontend`, run `npm install` and `npm run dev`; open http://localhost:5173.

Set `OPENAI_API_KEY` to enable grounded LLM summaries, questions, and quizzes. Without it, local fallback helpers are available. Supported uploads: PDF, DOCX, TXT (20 MB).

API: `/api/materials` (GET, POST, DELETE) and `/api/study/{id}/{summary|topics|ask|quiz}`.
=======
# AI-BASED-STUDY-ASSISTANT
Study planner for students
>>>>>>> 94f1ee61316e67d6b484d82b7434e501abdb9e17
