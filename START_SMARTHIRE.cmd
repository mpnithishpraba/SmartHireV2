@echo off
setlocal
cd /d "%~dp0app"
if errorlevel 1 (
  echo Could not find the SmartHire application folder.
  pause
  exit /b 1
)

set "PYTHON_CMD=python"
if exist "%~dp0.venv\Scripts\python.exe" (
  set "PYTHON_CMD="%~dp0.venv\Scripts\python.exe""
  goto run
)
python -c "import flask, PyPDF2, reportlab, faster_whisper, cv2, mediapipe, numpy" >nul 2>nul
if not errorlevel 1 goto run
py -3 -c "import flask, PyPDF2, reportlab, faster_whisper, cv2, mediapipe, numpy" >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=py -3"
  goto run
)
echo Required local Python packages are missing.
echo Follow the installation steps in README.md, or run once from the project folder:
echo   python -m pip install -r app\requirements.txt
echo For an air-gapped machine, use pre-downloaded wheels or the future packaged installer.
pause
exit /b 1

:run
echo Starting SmartHire. Open http://127.0.0.1:5000 in your browser.
echo Press Ctrl+C to stop it.
%PYTHON_CMD% main.py
endlocal
