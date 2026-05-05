@echo off
echo Starting BarberConnect Backend with Java Module Configuration...
echo.

REM Set JVM arguments for Java 17+ module system
set JAVA_OPTS=--add-opens java.base/java.time=ALL-UNNAMED --add-opens java.base/java.time.chrono=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.reflect=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED

REM Run Maven Spring Boot
mvn spring-boot:run -Dspring-boot.run.jvmArguments="%JAVA_OPTS%"
