# BarberConnect Backend - Spring Boot with Supabase

REST API backend for BarberConnect application built with Spring Boot and PostgreSQL (via Supabase).

## Prerequisites

- Java 17+
- Maven 3.8+
- Supabase account with PostgreSQL database

## Setup

### 1. Supabase Configuration

The backend is configured to connect to Supabase PostgreSQL database. Connection details:

```
Database URL: jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
Username: postgres
Password: melessacabasag123
```

**Note**: For production, move credentials to environment variables.

### 2. Create Database Tables

Execute the following SQL in your Supabase SQL editor:

```sql
create table "user" (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null,
  password varchar(255) not null,
  role varchar(20) not null check (role in ('CUSTOMER', 'BARBER', 'ADMIN')),
  created_at timestamp default now()
);

create table barber_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references "user"(id) on delete cascade,
  phone varchar(20),
  gcash_number varchar(20),
  created_at timestamp default now()
);

create table haircut_style (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid references "user"(id) on delete cascade,
  name varchar(100) not null,
  base_price numeric(10,2) not null,
  created_at timestamp default now()
);

create table appointment (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references "user"(id) on delete cascade,
  barber_id uuid references "user"(id) on delete cascade,
  haircut_id uuid references haircut_style(id),
  appointment_date date not null,
  appointment_time time not null,
  status varchar(20) not null check (status in ('BOOKED', 'COMPLETED', 'CANCELLED')),
  total_price numeric(10,2),
  payment_method varchar(20) check (payment_method in ('CASH', 'E_CASH')),
  created_at timestamp default now()
);

create table rating (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid unique references appointment(id) on delete cascade,
  customer_id uuid references "user"(id),
  barber_id uuid references "user"(id),
  stars integer check (stars >= 1 and stars <= 5),
  comment text,
  created_at timestamp default now()
);

create table income_record (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid unique references appointment(id) on delete cascade,
  barber_id uuid references "user"(id),
  total_amount numeric(10,2),
  barber_share numeric(10,2),
  owner_share numeric(10,2),
  created_at timestamp default now()
);
```

### 3. Install Dependencies

```bash
mvn clean install
```

### 4. Run Application

```bash
mvn spring-boot:run
```

Server will start on `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID

### Barbers
- `GET /api/barbers` - Get all barbers
- `GET /api/barbers/{id}` - Get barber profile
- `GET /api/barbers/{id}/styles` - Get barber's haircut styles
- `POST /api/barbers/{id}/styles` - Add haircut style

### Appointments
- `GET /api/appointments?customerId={id}` - Get customer's appointments
- `GET /api/appointments/barber/{barberId}` - Get barber's appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Delete appointment

### Ratings
- `GET /api/ratings` - Get all ratings
- `GET /api/ratings/barber/{barberId}` - Get barber's ratings
- `GET /api/ratings/customer/{customerId}` - Get customer's ratings
- `GET /api/ratings/appointment/{appointmentId}` - Get rating for appointment
- `POST /api/ratings` - Create rating
- `PUT /api/ratings/{id}` - Update rating
- `DELETE /api/ratings/{id}` - Delete rating

### Income Records
- `GET /api/income-records` - Get all income records
- `GET /api/income-records/barber/{barberId}` - Get barber's income records
- `GET /api/income-records/appointment/{appointmentId}` - Get income record for appointment
- `POST /api/income-records` - Create income record
- `PUT /api/income-records/{id}` - Update income record
- `DELETE /api/income-records/{id}` - Delete income record

## Technology Stack

- Spring Boot 3.1.5
- Spring Security with JWT
- Spring Data JPA
- PostgreSQL (via Supabase) with UUID primary keys
- Lombok for code generation
- JWT for authentication

## Database Schema Notes

- All IDs use UUID (PostgreSQL's `gen_random_uuid()`)
- Timestamps use `LocalDateTime` with automatic `created_at`
- Foreign keys with cascading delete for data integrity
- Enums for role and status fields
- Unique constraints on email, user_id in barber_profile, and appointment_id in rating/income_record
