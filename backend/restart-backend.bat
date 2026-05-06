@echo off
echo ========================================
echo  BarberConnect Backend Restart Script
echo ========================================
echo.

echo Step 1: Killing any Java process on port 8080...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8080 ^| findstr LISTENING') do (
    echo Killing PID %%a
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Starting backend with Java module configuration...
echo.
echo Backend will start on: http://localhost:8080
echo API Base URL:          http://localhost:8080/api/v1
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

set JVM_ARGS=--add-opens java.base/java.time=ALL-UNNAMED --add-opens java.base/java.time.chrono=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.reflect=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED

mvn spring-boot:run -Dspring-boot.run.jvmArguments="%JVM_ARGS%"
