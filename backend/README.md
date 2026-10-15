# StudyWise Backend

Spring Boot REST API for StudyWise AI Study Assistant.

## Features
- Document processing: extracts and analyzes text from PDF, DOCX, and TXT files.
- AI-Powered Study Tools:
  - Summarization (bullet point synthesis)
  - Key Topic Extraction
  - Note-grounded Q&A (tutor)
  - Practice Quiz Generation (with explanations)
  - Flashcard Generation
- Works with OpenAI (`gpt-4o-mini`) when `OPENAI_API_KEY` is provided, and includes smart heuristic fallbacks when no key is set.
- Database Agnostic: Supports both MySQL (default local) and PostgreSQL (default on Render/cloud).
- Full CORS support for local development and Vercel frontend domains.

---

## Local Development (Run Individually)

### Prerequisites
- Java 17+ (JDK)
- Maven 3.8+
- MySQL Server (running on `localhost:3306`) or any configured database

### Configuration
Local defaults in `src/main/resources/application.properties`:
- Port: `8080`
- Database: `jdbc:mysql://localhost:3306/study_assistant`
- Username: `root`
- Password: `DB_PASSWORD` (set via env var or application.properties)

### Run
```bash
# Compile and run
mvn spring-boot:run

# Or package and run jar
mvn clean package -DskipTests
java -jar target/study-assistant-1.0.0.jar
```

Verify backend health at: [http://localhost:8080/](http://localhost:8080/) or [http://localhost:8080/api/health](http://localhost:8080/api/health).

---

## Deployment to Render (render.com)

### Method 1: Using Render Blueprint (`render.yaml`)
1. Log in to [render.com](https://render.com).
2. Go to **Blueprints** -> **New Blueprint Instance**.
3. Select `AI-BASED-STUDY-ASSISTANT-BACKEND`.
4. Render will automatically detect `render.yaml` and provision:
   - Web Service (`studywise-backend`)
   - Managed PostgreSQL database (`studywise-db`)
5. Click **Apply**.

### Method 2: Manual Web Service Setup
1. On Render Dashboard, click **New +** -> **Web Service**.
2. Connect your repository: `AI-BASED-STUDY-ASSISTANT-BACKEND`.
3. Settings:
   - **Environment**: `Docker` (or Java with Build Command `mvn clean package -DskipTests` and Start Command `java -jar target/study-assistant-1.0.0.jar`)
   - **Plan**: Free
4. Add Environment Variables:
   - `PORT`: `8080`
   - `DATABASE_URL`: Your PostgreSQL connection string (from Render Postgres or Neon/Supabase) or `DB_URL` for MySQL.
   - `OPENAI_API_KEY`: *(Optional)* Your OpenAI API Key.
   - `FRONTEND_ORIGIN`: `*` (or your Vercel frontend URL, e.g. `https://your-frontend.vercel.app`)
5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g. `https://studywise-backend.onrender.com`).
