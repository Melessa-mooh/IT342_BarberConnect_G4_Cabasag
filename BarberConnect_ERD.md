# BarberConnect - Entity Relationship Diagram (ERD)

## Database Schema Overview

The BarberConnect system uses Firebase/Firestore as the database with the following entities and relationships:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           BARBERCONNECT ERD                                         │
│                        Group ID: edu.cit.cabasag                                   │
│                        Artifact ID: barberconnect                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│       USER          │         │   BARBER_PROFILE    │         │    HAIRCUT_STYLE    │
├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
│ user_id (PK)        │◄────────┤ barber_profile_id   │◄────────┤ haircut_style_id    │
│ firstName           │         │ (PK)                │         │ (PK)                │
│ lastName            │         │ user_id (FK)        │         │ barber_profile_id   │
│ email               │         │ bio                 │         │ (FK)                │
│ phoneNumber         │         │ yearsExperience     │         │ name                │
│ role (ENUM)         │         │ rating              │         │ description         │
│ isActive            │         │ totalReviews        │         │ basePrice           │
│ createdAt           │         │ profileImageUrl     │         │ durationMinutes     │
│ updatedAt           │         │ isAvailable         │         │ imageUrl            │
└─────────────────────┘         │ createdAt           │         │ isActive            │
         │                      │ createdAt           │         │ isActive            │
         │                      │ updatedAt           │         │ createdAt           │
         │                      └─────────────────────┘         │ updatedAt           │
         │                               │                      └─────────────────────┘
         │                               │                               │
         │                               │                               │
         │                               │                               ▼
         │                               │                      ┌─────────────────────┐
         │                               │                      │   STYLE_OPTION      │
         │                               │                      ├─────────────────────┤
         │                               │                      │ style_option_id     │
         │                               │                      │ (PK)                │
         │                               │                      │ haircut_style_id    │
         │                               │                      │ (FK)                │
         │                               │                      │ name                │
         │                               │                      │ description         │
         │                               │                      │ additionalPrice     │
         │                               │                      │ additionalTimeMin   │
         │                               │                      │ isActive            │
         │                               │                      └─────────────────────┘
         │                               │
         │                               ▼
         │                      ┌─────────────────────┐
         │                      │       POST          │
         │                      ├─────────────────────┤
         │                      │ post_id (PK)        │
         │                      │ barber_profile_id   │
         │                      │ (FK)                │
         │                      │ content             │
         │                      │ imageUrl            │
         │                      │ likesCount          │
         │                      │ commentsCount       │
         │                      │ isActive            │
         │                      │ createdAt           │
         │                      │ updatedAt           │
         │                      └─────────────────────┘
         │                               │
         │                               │
         ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│     COMMENT         │         │     REACTION        │
├─────────────────────┤         ├─────────────────────┤
│ comment_id (PK)     │         │ reaction_id (PK)    │
│ post_id (FK)        │◄────────┤ post_id (FK)        │
│ user_id (FK)        │         │ user_id (FK)        │
│ content             │         │ type (ENUM)         │
│ isActive            │         │ createdAt           │
│ createdAt           │         └─────────────────────┘
│ updatedAt           │
└─────────────────────┘

         │
         │
         ▼
┌─────────────────────┐         ┌─────────────────────┐
│    APPOINTMENT      │         │     FEEDBACK        │
├─────────────────────┤         ├─────────────────────┤
│ appointment_id (PK) │◄────────┤ feedback_id (PK)    │
│ customer_id (FK)    │         │ appointment_id (FK) │
│ barber_profile_id   │         │ customer_id (FK)    │
│ (FK)                │         │ barber_profile_id   │
│ haircut_style_id    │         │ (FK)                │
│ (FK)                │         │ rating (1-5)        │
│ appointmentDateTime │         │ comment             │
│ durationMinutes     │         │ isActive            │
│ totalPrice          │         │ createdAt           │
│ status (ENUM)       │         └─────────────────────┘
│ paymentMethod (ENUM)│
│ paymentStatus (ENUM)│
│ notes               │
│ selectedOptionIds   │
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
         │
         │
         ▼
┌─────────────────────┐
│   INCOME_RECORD     │
├─────────────────────┤
│ income_record_id    │
│ (PK)                │
│ barber_profile_id   │
│ (FK)                │
│ appointment_id (FK) │
│ amount              │
│ platformFee         │
│ netAmount           │
│ paymentMethod (ENUM)│
│ recordedAt          │
└─────────────────────┘
```

## Entity Details

### 1. USER
**Primary Entity for all system users**
- **Primary Key**: `user_id` (String) - Firebase UID
- **Role**: CUSTOMER, BARBER, ADMIN
- **Phone Format**: Philippine format (+63 9XX XXX XXXX or 09XX XXX XXXX)
- **Relationships**: 
  - One-to-One with BarberProfile (if role = BARBER)
  - One-to-Many with Comments
  - One-to-Many with Reactions
  - One-to-Many with Appointments (as customer)
  - One-to-Many with Feedback (as customer)

### 2. BARBER_PROFILE
**Extended profile for barber users**
- **Primary Key**: `barber_profile_id` (String)
- **Foreign Key**: `user_id` → User.user_id
- **Relationships**:
  - One-to-Many with HaircutStyles
  - One-to-Many with Posts
  - One-to-Many with Appointments (as barber)
  - One-to-Many with Feedback (as barber)
  - One-to-Many with IncomeRecords

### 3. HAIRCUT_STYLE
**Services offered by barbers**
- **Primary Key**: `haircut_style_id` (String)
- **Foreign Key**: `barber_profile_id` → BarberProfile.barber_profile_id
- **Relationships**:
  - One-to-Many with StyleOptions
  - One-to-Many with Appointments

### 4. STYLE_OPTION
**Additional services for haircut styles**
- **Primary Key**: `style_option_id` (String)
- **Foreign Key**: `haircut_style_id` → HaircutStyle.haircut_style_id
- **Relationships**:
  - Many-to-Many with Appointments (via selectedOptionIds)

### 5. APPOINTMENT
**Booking system core entity**
- **Primary Key**: `appointment_id` (String)
- **Foreign Keys**: 
  - `customer_id` → User.user_id
  - `barber_profile_id` → BarberProfile.barber_profile_id
  - `haircut_style_id` → HaircutStyle.haircut_style_id
- **Status**: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
- **Payment**: CASH, CARD, DIGITAL_WALLET
- **Relationships**:
  - One-to-One with Feedback
  - One-to-One with IncomeRecord

### 6. POST
**Social media functionality**
- **Primary Key**: `post_id` (String)
- **Foreign Key**: `barber_profile_id` → BarberProfile.barber_profile_id
- **Relationships**:
  - One-to-Many with Comments
  - One-to-Many with Reactions

### 7. COMMENT
**Comments on posts**
- **Primary Key**: `comment_id` (String)
- **Foreign Keys**:
  - `post_id` → Post.post_id
  - `user_id` → User.user_id

### 8. REACTION
**Reactions on posts**
- **Primary Key**: `reaction_id` (String)
- **Foreign Keys**:
  - `post_id` → Post.post_id
  - `user_id` → User.user_id
- **Types**: LIKE, LOVE, FIRE, CLAP

### 9. FEEDBACK
**Reviews and ratings**
- **Primary Key**: `feedback_id` (String)
- **Foreign Keys**:
  - `appointment_id` → Appointment.appointment_id
  - `customer_id` → User.user_id
  - `barber_profile_id` → BarberProfile.barber_profile_id
- **Rating**: 1-5 stars

### 10. INCOME_RECORD
**Financial tracking for barbers**
- **Primary Key**: `income_record_id` (String)
- **Foreign Keys**:
  - `barber_profile_id` → BarberProfile.barber_profile_id
  - `appointment_id` → Appointment.appointment_id
- **Payment Methods**: CASH, CARD, DIGITAL_WALLET

## Key Relationships

### User Management
- **User** ←→ **BarberProfile**: One-to-One (conditional)
- **User** → **Appointments**: One-to-Many (as customer)
- **User** → **Comments**: One-to-Many
- **User** → **Reactions**: One-to-Many

### Barber Services
- **BarberProfile** → **HaircutStyles**: One-to-Many
- **HaircutStyle** → **StyleOptions**: One-to-Many
- **BarberProfile** → **Posts**: One-to-Many

### Booking System
- **Appointment** ←→ **User** (customer): Many-to-One
- **Appointment** ←→ **BarberProfile**: Many-to-One
- **Appointment** ←→ **HaircutStyle**: Many-to-One
- **Appointment** ←→ **StyleOptions**: Many-to-Many (via selectedOptionIds)

### Social Features
- **Post** → **Comments**: One-to-Many
- **Post** → **Reactions**: One-to-Many

### Reviews & Analytics
- **Appointment** ←→ **Feedback**: One-to-One
- **Appointment** ←→ **IncomeRecord**: One-to-One

## Maven Configuration
- **Group ID**: `edu.cit.cabasag`
- **Artifact ID**: `barberconnect`
- **Package**: `edu.cit.cabasag.barberconnect`

## Primary Key Naming Convention
All primary keys follow the pattern: `{entity_name}_id`
- User: `user_id`
- BarberProfile: `barber_profile_id`
- Appointment: `appointment_id`
- HaircutStyle: `haircut_style_id`
- StyleOption: `style_option_id`
- Post: `post_id`
- Comment: `comment_id`
- Reaction: `reaction_id`
- Feedback: `feedback_id`
- IncomeRecord: `income_record_id`

## Philippine Phone Number Format
- **Accepted Formats**: 
  - `+63 9XX XXX XXXX` (International format)
  - `09XX XXX XXXX` (Local format)
- **Validation Pattern**: `^(\+63|0)?[9][0-9]{9}$`
- **Auto-formatting**: Frontend automatically formats input
- **Storage**: Stored in normalized format (+639XXXXXXXXX)

## Database Technology
- **Primary Database**: Firebase/Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **File Storage**: Firebase Storage (for images)
- **Real-time Updates**: Firestore real-time listeners

## Indexes Recommended
- User.email (unique)
- Appointment.customer_id + appointmentDateTime
- Appointment.barber_profile_id + appointmentDateTime
- Post.barber_profile_id + createdAt
- Feedback.barber_profile_id + rating
- IncomeRecord.barber_profile_id + recordedAt