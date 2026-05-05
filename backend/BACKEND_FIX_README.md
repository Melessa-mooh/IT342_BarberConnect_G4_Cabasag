# Backend Fix Instructions

## Problem
The backend was experiencing Java 17+ module system errors:
```
Unable to make private java.time.chrono.IsoChronology() accessible: 
module java.base does not "opens java.time.chrono" to unnamed module
```

## Solution

### Option 1: Use the Startup Script (Recommended)
Run the backend using the provided script:
```bash
cd backend
./run-backend.bat
```

### Option 2: Manual Maven Command
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.jvmArguments="--add-opens java.base/java.time=ALL-UNNAMED --add-opens java.base/java.time.chrono=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.reflect=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED"
```

### Option 3: Run from IDE
If running from IntelliJ IDEA or Eclipse, add these VM options:
```
--add-opens java.base/java.time=ALL-UNNAMED
--add-opens java.base/java.time.chrono=ALL-UNNAMED
--add-opens java.base/java.lang=ALL-UNNAMED
--add-opens java.base/java.lang.reflect=ALL-UNNAMED
--add-opens java.base/java.util=ALL-UNNAMED
```

## What Was Fixed

1. **pom.xml** - Added JVM arguments to Spring Boot Maven plugin
2. **run-backend.bat** - Created startup script with proper JVM configuration
3. **Module Access** - Opened necessary Java modules for Firebase and Jackson serialization

## Verify Backend is Running

1. Start the backend using one of the methods above
2. Check the console output for:
   ```
   Started BarberconnectBackendApplication in X.XXX seconds
   ```
3. Test the health endpoint:
   ```
   http://localhost:8080/api/v1/auth/me
   ```

## Common Issues

### Port Already in Use
If you see "Port 8080 is already in use":
1. Find the process: `netstat -ano | findstr :8080`
2. Kill it: `taskkill /PID <process_id> /F`
3. Restart the backend

### Connection Refused
If frontend shows "ERR_CONNECTION_REFUSED":
1. Make sure backend is running
2. Check backend console for errors
3. Verify port 8080 is accessible

### 400 Bad Request Errors
If you see 400 errors in browser console:
1. Check backend logs for detailed error messages
2. Verify request payload format
3. Check authentication token is valid

## Testing

After starting the backend, test these endpoints:

1. **Health Check**: `GET http://localhost:8080/api/v1/auth/me`
2. **Posts**: `GET http://localhost:8080/api/v1/posts`
3. **Barber Profile**: `GET http://localhost:8080/api/v1/barbers/{id}/profile`

All should return proper responses (not 400 errors).
