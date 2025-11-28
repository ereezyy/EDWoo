@echo off
REM Docker Deployment Quickstart Script for TTS-LLM-TTS
REM This script helps you quickly deploy the TTS-LLM-TTS system using Docker Compose

echo ========================================
echo TTS-LLM-TTS Docker Deployment
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: docker-compose is not installed or not in PATH
    pause
    exit /b 1
)

echo Docker and docker-compose found!
echo.

REM Check if .env file exists
if not exist .env (
    echo .env file not found. Creating from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit the .env file with your API keys before continuing!
    echo Press any key to open .env file in notepad...
    pause >nul
    notepad .env
    echo.
    echo Have you updated your API keys in .env file?
    choice /C YN /M "Continue with deployment"
    if errorlevel 2 exit /b 0
)

echo.
echo Starting Docker Compose build and deployment...
echo This may take several minutes on first run...
echo.

docker-compose up --build -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Deployment successful!
    echo ========================================
    echo.
    echo Services are starting up. This may take a few minutes.
    echo.
    echo Access points:
    echo   - Web UI: http://localhost:8080
    echo   - Orchestrator API: http://localhost:5000
    echo   - STT Service: http://localhost:5001
    echo   - LLM Service: http://localhost:5002
    echo   - TTS Service: http://localhost:5003
    echo   - Memory Service: http://localhost:5004
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop services: docker-compose down
    echo.
    echo Opening Web UI in default browser...
    timeout /t 5 /nobreak >nul
    start http://localhost:8080
) else (
    echo.
    echo ERROR: Deployment failed!
    echo Check the logs with: docker-compose logs
    pause
    exit /b 1
)

pause
