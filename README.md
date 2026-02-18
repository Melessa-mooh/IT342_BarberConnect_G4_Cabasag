# IT342_BarberConnect_G4_Cabasag
# BarberConnect ✂️

BarberConnect is a full-stack barbershop management system designed for both mobile and web platforms. It allows customers to book appointments and make payments, while barbers can manage services, upload images, and handle bookings efficiently.

---

## 📌 Project Overview

BarberConnect provides secure authentication, role-based access control, appointment scheduling, payment integration (Stripe Sandbox), Firebase image storage, and email notifications using SMTP.

The system is built using a modern layered architecture with separate frontend and backend components.

---

## 🚀 Features

### 🔐 Authentication & Security

* User Registration & Login
* JWT Authentication
* BCrypt Password Hashing
* Google OAuth Login
* Role-Based Access Control (BARBER / CUSTOMER)

### 📅 Appointment Management

* Book appointments
* View appointments
* Update booking status
* Cancel appointments
* Date & time conflict validation

### 💳 Payment Integration

* Stripe Sandbox integration
* Payment status tracking
* Automatic appointment status update after payment

### 🖼 File Upload System

* Image upload (JPEG/PNG)
* Firebase Storage integration
* Image URL stored in database

### 📧 Email Notification System

* Welcome email after registration
* Booking confirmation email after payment
* SMTP-based email sending

### 🌐 External API Integration

* Public API consumption (e.g., weather API)
* Dashboard display
* Graceful error handling

---

## 🏗 System Architecture

The system follows a **Layered Architecture**:

Controller → Service → Repository → Database

Includes:

* Security Configuration
* DTO Pattern
* Global Exception Handling

---

## 🛠 Technology Stack

### Backend

* Spring Boot (Java)
* MySQL Database
* JWT
* BCrypt

### Mobile Application

* Kotlin (Android)

### Web Application

* HTML

### Cloud & Services

* Firebase (Authentication & Storage)
* Stripe Sandbox (Payment)
* SMTP Mail Server

---

## 📦 Installation Guide

### 1️⃣ Backend Setup

1. Clone the repository
2. Configure application.properties:

   * Database credentials
   * JWT secret key
   * Stripe sandbox keys
   * SMTP credentials
   * Firebase configuration
3. Run Spring Boot application

### 2️⃣ Mobile App Setup

1. Open project in Android Studio
2. Connect API base URL
3. Run on emulator or physical device

### 3️⃣ Web Setup

1. Open HTML project
2. Connect API base URL
3. Run using browser

---

## 🔒 Non-Functional Requirements

* API response time ≤ 2 seconds
* HTTPS secured communication
* Supports at least 100 concurrent users
* No plain-text password storage
* 99% uptime during testing phase
* Responsive web design

---

## 👥 User Roles

### Customer

* Register/Login
* Book appointments
* Make payments
* View booking history

### Barber

* Manage services
* Upload service images
* Accept or update appointments

---

## 📄 License

This project is developed for academic purposes (Project Individual and future purposes).

---

## 👩‍💻 Author

Cabasag, Ma. Melessa V.

---

✨ BarberConnect – Connecting Barbers and Customers Seamlessly.