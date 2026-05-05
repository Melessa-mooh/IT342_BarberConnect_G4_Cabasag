@echo off
echo ========================================
echo  BarberConnect Backend Restart Script
echo ========================================
echo.

echo Step 1: Stopping any running Java processes on port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo Found process %%a on port 8080
    taskkill /F /PID %%a 2>nul
    if errorlevel 1 (
        echo Could not kill process %%a - it may not exist
    ) else (
        echo Successfully stopped process %%a
    )
)

echo.
echo Step 2: Cleaning and rebuilding project...
call mvn clean compile

if errorlevel 1 (
    echo.
    echo ERROR: Maven build failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo Step 3: Starting backend with Java module configuration...
echo.
echo Backend will start on: http://localhost:8080
echo API Base URL: http://localhost:8080/api/v1
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Set JVM arguments for Java 17+ module system
set JAVA_OPTS=--add-opens java.base/java.time=ALL-UNNAMED --add-opens java.base/java.time.chrono=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.reflect=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED

REM Run Maven Spring Boot
mvn spring-boot:run -Dspring-boot.run.jvmArguments="%JAVA_OPTS%"
