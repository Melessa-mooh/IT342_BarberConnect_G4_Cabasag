# BarberConnect

A modern barbershop management system with customer booking, barber profiles, and social features.

## Architecture

- **Backend**: Spring Boot with Firebase Authentication, H2 Database
- **Frontend**: React with TypeScript, Firebase Auth, Axios
- **Database**: H2 (development), ready for PostgreSQL/MySQL in production

## Features Implemented

### Authentication
- Firebase Authentication integration
- Role-based access (Customer, Barber, Admin)
- JWT token validation
- User registration and login

### Customer Features
- Customer dashboard with barber feed
- View available barbers
- Barber profiles with ratings and experience

### Backend API
- RESTful API with proper error handling
- CORS configuration for frontend integration
- Sample data initialization
- Comprehensive data models

## Quick Start

### Prerequisites
- Java 17+
- Node.js 16+
- Firebase project (already configured)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Set up environment configuration:
```bash
# Copy the example files and update with your actual values
cp src/main/resources/application.properties.example src/main/resources/application.properties
cp src/main/resources/serviceAccountKey.json.example src/main/resources/serviceAccountKey.json
```

3. Update configuration files:
   - Edit `src/main/resources/application.properties` with your database and API settings
   - Replace `src/main/resources/serviceAccountKey.json` with your actual Firebase service account key
   - Update Cloudinary credentials if using image uploads

4. Run the application:
```bash
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd web/barberconnect-frontend
```

2. Set up environment configuration:
```bash
# Copy the example file and update with your actual values
cp .env.example .env
```

3. Update the `.env` file with your Firebase configuration:
   - Get your Firebase config from the Firebase Console
   - Update all VITE_FIREBASE_* variables with your actual values

4. Install dependencies:
```bash
npm install
```

5. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Test Accounts

The system initializes with sample data:

### Customers
- Email: `customer@test.com`
- Email: `jane.smith@test.com`

### Barbers
- Email: `barber@test.com` (Marcus Johnson)
- Email: `david.chen@test.com` (David Chen)
- Email: `james.wilson@test.com` (James Wilson)

### Admin
- Email: `admin@test.com`

**Note**: You'll need to create these accounts in Firebase Authentication first, then they'll be linked to the backend profiles.

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Barbers
- `GET /api/v1/barbers/public/available` - Get available barbers
- `GET /api/v1/barbers/public/{id}` - Get barber by ID

## Database

The application uses H2 in-memory database for development. You can access the H2 console at:
- URL: `http://localhost:8080/api/v1/h2-console`
- JDBC URL: `jdbc:h2:mem:barberconnect`
- Username: `sa`
- Password: `password`

## Next Steps

To complete the implementation based on your UI mockups:

1. **Booking System**: Implement appointment creation and management
2. **Haircut Styles**: Add haircut catalog with pricing
3. **Payment Integration**: Add payment processing
4. **Social Features**: Complete post creation, comments, and reactions
5. **Admin Dashboard**: Implement admin features for income tracking
6. **Mobile App**: Develop React Native mobile application

## Project Structure

```
barberconnect/
├── backend/                 # Spring Boot API
│   ├── src/main/java/
│   │   └── com/barberconnect/backend/
│   │       ├── config/      # Configuration classes
│   │       ├── controller/  # REST controllers
│   │       ├── dto/         # Data transfer objects
│   │       ├── model/       # JPA entities
│   │       ├── repository/  # Data repositories
│   │       ├── security/    # Security configuration
│   │       └── service/     # Business logic
│   └── src/main/resources/
├── web/barberconnect-frontend/  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context
│   │   ├── pages/           # Page components
│   │   ├── routes/          # Routing configuration
│   │   └── services/        # API services
└── docs/                    # Documentation
```

## Technologies Used

### Backend
- Spring Boot 3.5
- Spring Security
- Spring Data JPA
- Firebase Admin SDK
- H2 Database
- Lombok
- Maven

### Frontend
- React 19
- TypeScript
- Firebase SDK
- Axios
- React Router
- Vite

The application is now ready for development and testing!