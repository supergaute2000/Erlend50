@echo off
echo Setting up Bror 50 - The Game...
echo.

echo Installing dependencies...
npm install
echo.

echo Generating placeholder assets...
npm run generate-assets
echo.

echo Setup complete! You can now run the game using run_debug.bat
echo.
pause 