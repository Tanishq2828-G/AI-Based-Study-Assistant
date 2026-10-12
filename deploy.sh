#!/usr/bin/env bash
set -e

echo "========================================================"
echo "Building Studywise for Production Deployment"
echo "========================================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/3] Building frontend assets..."
cd "$ROOT_DIR/frontend"
npm install
npm run build

echo "[2/3] Embedding frontend into backend static resources..."
cd "$ROOT_DIR"
mkdir -p "$ROOT_DIR/backend/src/main/resources/static"
cp -r "$ROOT_DIR/frontend/dist/"* "$ROOT_DIR/backend/src/main/resources/static/"

echo "[3/3] Packaging standalone executable JAR..."
cd "$ROOT_DIR/backend"
mvn clean package -DskipTests

echo "========================================================"
echo "BUILD SUCCESSFUL!"
echo "Run the full application with:"
echo "  java -jar backend/target/study-assistant-1.0.0.jar"
echo "Access at: http://localhost:8080"
echo "========================================================"
