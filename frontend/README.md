# StudyWise Frontend

An AI-powered study assistant user interface built with React, Vite, and Lucide icons.

## Features
- Upload PDF, DOCX, and TXT class notes & textbooks
- Real-time study workspace with tabs:
  - **Overview**: Study desk & recent materials
  - **Summary**: Key points and core relationships extracted from material
  - **Topics**: Auto-discovered key concepts
  - **Ask AI**: Context-grounded Q&A against uploaded notes
  - **Practice Quiz**: Dynamic multiple-choice questions with answers & explanations
- Responsive modern UI designed for desktop and mobile

---

## Local Development (Run Individually)

### Prerequisites
- Node.js (v18+)
- Backend running on `http://localhost:8080` (or configure `VITE_API_URL`)

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
API calls to `/api/*` are automatically proxied to `http://localhost:8080`.

### Production Build
```bash
npm run build
npm run preview
```

---

## Deployment to Vercel (vercel.com)

1. **Sign in to Vercel**: Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. **Add New Project**: Click **"Add New..."** -> **"Project"**.
3. **Import Repository**: Select `AI-BASED-STUDY-ASSISTANT-FRONTEND`.
4. **Configure Project Settings**:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Set Environment Variables**:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g. `https://studywise-backend.onrender.com` without trailing slash)
6. **Deploy**: Click **"Deploy"**.
7. Vercel will build and assign you a live production URL (e.g., `https://your-app.vercel.app`).
