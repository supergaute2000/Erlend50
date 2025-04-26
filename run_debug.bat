@echo off
echo Starting Bror 50 - The Game in Debug Mode...
echo Please wait while the server starts...
echo.
echo Once the server is running, open your browser and go to:
echo http://localhost:8000/debug.html
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.

start "" "http://localhost:8000/debug.html"
python -m http.server 8000 