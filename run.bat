@echo off
REM Quick Start Script for Hand Detection System

echo.
echo ============================================================
echo  Hand Detection & Gesture Recognition System
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Check if requirements are installed
python -c "import cv2, mediapipe, numpy" >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements_python.txt
    echo.
)

REM Run the application
echo Starting Hand Detection System...
echo.
echo Press 'q' to quit
echo Press 'f' to toggle fullscreen
echo Press 's' to save screenshot
echo Press 'r' to reset gesture counter
echo Press 'm' to toggle mouse visualization
echo.

python hand_detection.py %*

echo.
pause
