@echo off
echo ========================================================
echo Building Studywise for Production Deployment
echo ========================================================

cd /d "%~dp0frontend"
echo [1/3] Building frontend assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    exit /b %errorlevel%
)

cd /d "%~dp0"
echo [2/3] Embedding frontend into backend static resources...
if not exist "backend\src\main\resources\static" mkdir "backend\src\main\resources\static"
xcopy /E /I /Y "frontend\dist\*" "backend\src\main\resources\static\"

cd /d "%~dp0backend"
echo [3/3] Packaging standalone executable JAR...
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed!
    exit /b %errorlevel%
)

echo ========================================================
echo BUILD SUCCESSFUL!
echo Run the full application with:
echo   java -jar backend\target\study-assistant-1.0.0.jar
echo Access at: http://localhost:8080
echo ========================================================
