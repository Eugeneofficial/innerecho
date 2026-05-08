@echo off
echo.
echo ========================================
echo    FoodSync - Starting application
echo ========================================
echo.
echo Starting backend server...
start "FoodSync Server" cmd /k "cd /d "%~dp0server" && npm start"
timeout /t 2 >nul
echo.
echo Starting frontend...
start "FoodSync Client" cmd /k "cd /d "%~dp0client" && npm start"
echo.
echo Both services are starting in separate windows.
echo.
pause
