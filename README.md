# BarberConnect ✂️

## 📌 What is BarberConnect?

BarberConnect is a comprehensive, full-stack barbershop management platform designed to bridge the gap between barbers and their customers.

In today's fast-paced world, booking a haircut can be tedious, involving back-and-forth phone calls and unorganized schedules. BarberConnect solves this by providing a unified digital hub where:
- **Customers** can effortlessly discover services, browse barber portfolios, book appointments securely, and keep track of their grooming schedules.
- **Barbers** can digitize their business, manage daily bookings, showcase their work through image uploads, and reduce no-shows with automated scheduling and notifications.
- **Admins** can manage barber accounts, monitor platform statistics, and approve leave requests.

By combining a sleek, customer-facing mobile application with a powerful management web dashboard, BarberConnect creates a seamless, end-to-end grooming experience.

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 17, Spring Boot 3.5, Maven |
| **Database** | Cloud Firestore (Firebase NoSQL) |
| **Authentication** | Google Aoth2 + Custom JWT (jjwt 0.12.3) |
| **Image Storage** | Cloudinary |
| **Web Frontend** | React 18, TypeScript, Vite, Axios |
| **Mobile** | Android (Kotlin), MVVM, Retrofit2, OkHttp3 |
| **Architecture** | Vertical Slice Architecture |

---

## ✅ Prerequisites — What to Install

Before running any part of the project, make sure you have the following tools installed on your machine.

### 🔧 Global Requirements (All Platforms)

| Tool | Version | Download |
|---|---|---|
| **Git** | Latest | https://git-scm.com/downloads |
| **Java JDK** | 17 (LTS) | https://adoptium.net/ |
| **Node.js** | 18+ (LTS) | https://nodejs.org/ |
| **npm** | Comes with Node.js | — |

> ⚠️ Verify installations by running: `java -version`, `node -v`, `npm -v`, `git --version`

---

### ☕ Backend Requirements

| Tool | Version | Notes |
|---|---|---|
| **Java JDK 17** | 17 (LTS) | Required to compile and run Spring Boot |
| **Maven** | 3.9+ | Bundled via `mvnw` wrapper — no separate install needed |
| **Firebase Admin SDK** | 9.2.0 | Included in `pom.xml` — auto-downloaded by Maven |
| **Firebase Project** | Any | You must create a Firebase project and download `serviceAccountKey.json` |
| **Cloudinary Account** | Free tier | Required for image upload functionality |

**Setup Steps:**

```bash
# 1. Clone the repo
git clone https://github.com/Melessa-mooh/IT342_BarberConnect_G4_Cabasag.git
cd IT342_BarberConnect_G4_Cabasag/backend

# 2. Add your environment config (create this file — never commit it)
# File: backend/src/main/resources/application.properties
# Required keys:
#   firebase.service-account-key=<path-to-serviceAccountKey.json>
#   cloudinary.cloud-name=<your-cloud-name>
#   cloudinary.api-key=<your-api-key>
#   cloudinary.api-secret=<your-api-secret>
#   jwt.secret=<your-secret-key>
# Environment variables for optional default admin bootstrap:
#   BARBERCONNECT_ADMIN_EMAIL=admin@barberconnect.com
#   BARBERCONNECT_ADMIN_PASSWORD=change-this-password

# 3. Run the backend (starts on http://localhost:8080)
./mvnw spring-boot:run        # macOS / Linux
mvnw.cmd spring-boot:run      # Windows
```

---

### 🌐 Web Frontend Requirements

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | 18+ | JavaScript runtime |
| **npm** | 9+ | Package manager (comes with Node.js) |
| **Vite** | Bundled | No separate install — `npm install` handles it |

**Setup Steps:**

```bash
# 1. Navigate to the frontend directory
cd web/barberconnect-frontend

# 2. Install all dependencies
npm install

# 3. Start the development server (runs on http://localhost:5173)
npm run dev
```

> ℹ️ Make sure the backend is running on `http://localhost:8080` before starting the frontend.

**Run Frontend Tests:**

```bash
npm run test
```

---

### 📱 Mobile App Requirements

| Tool | Version | Download |
|---|---|---|
| **Android Studio** | Iguana (2023.2.1+) | https://developer.android.com/studio |
| **Android SDK** | API 26+ (Android 8.0) | Installed via Android Studio SDK Manager |
| **Kotlin Plugin** | Bundled in Android Studio | — |
| **JDK 17** | 17 (LTS) | Configured inside Android Studio |
| **Google Services JSON** | — | Download from your Firebase Console |

**Setup Steps:**

1. Open **Android Studio** → `File → Open` → select the `mobile/` folder
2. Add your `google-services.json` file to `mobile/app/` (download from your Firebase Console → Project Settings → Android app)
3. Update the `BASE_URL` in `mobile/app/build.gradle.kts`:
   - **Emulator:** `http://10.0.2.2:8080/api/v1/`
   - **Real device (same Wi-Fi):** `http://<your-PC-local-IP>:8080/api/v1/`
4. Click **Sync Project with Gradle Files** (the elephant icon)
5. Run the app on an emulator or physical Android device (API 26+)

> ⚠️ `google-services.json` is listed in `.gitignore` and must **never** be committed to the repository.

---

### 🔥 Firebase Setup (Required for All Platforms)

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (or use an existing one)
3. Enable **Firestore Database** (Native mode)
4. Enable **Firebase Authentication** (Email/Password + Google Sign-In)
5. **For backend:** Go to `Project Settings → Service Accounts → Generate new private key` → save as `serviceAccountKey.json`
6. **For mobile:** Go to `Project Settings → General → Your apps → Android → Download google-services.json`

---

## 🏗️ Architecture Overview

BarberConnect follows **Vertical Slice Architecture** — each feature owns its controller, service, and model within a cohesive package:

```
backend/feature/
├── shared/         ← FirebaseService, CloudinaryService
├── auth/           ← AuthService, User
├── appointment/    ← AppointmentService, Appointment
├── barber/         ← BarberService, BarberProfile
├── catalog/        ← HaircutStyleService, HaircutStyle, StyleOption
├── admin/          ← AdminService, LeaveRequest
├── income/         ← IncomeRecord
└── social/         ← Post, Comment, Feedback, Reaction

web/src/features/
├── auth/           ← authService + login/register pages
├── appointment/    ← appointmentService + AppointmentsPanel
├── barber/         ← barberService + dashboard panels
├── catalog/        ← haircutStyleService + CatalogPanel
└── admin/          ← adminService + admin pages

mobile/feature/
├── auth/           ← LoginActivity, RegisterActivity, AuthViewModel
├── dashboard/      ← DashboardActivity
└── core/           ← RetrofitClient, ApiService, TokenManager
```

---

## 🌟 Key Features

| Feature | Customer | Barber | Admin |
|---|---|---|---|
| Register / Login | ✅ | ✅ | ✅ |
| Google Sign-In | ✅ | — | — |
| Book Appointment | ✅ | — | — |
| Manage Appointments | — | ✅ | ✅ |
| Haircut Catalog | View | Manage | View |
| Income Dashboard | — | ✅ | ✅ |
| Leave Requests | — | Submit | Approve |
| Social Feed / Posts | View | Post | Moderate |
| Profile Management | ✅ | ✅ | ✅ |
| Admin Create Barber | — | — | ✅ |

---

## 🚀 Running Tests

### Backend (JUnit 5 + Mockito)
```bash
cd backend
./mvnw test          # macOS / Linux
mvnw.cmd test        # Windows
```

### Frontend (Vitest)
```bash
cd web/barberconnect-frontend
npm run test
```

---

## 📄 License & Credits

Designed and developed for academic requirements (IT342 — Systems Integration and Architecture 1) showcasing modern full-stack software engineering practices including Vertical Slice Architecture and Regression Testing.

**Author:** Cabasag, Ma. Melessa V. — G4

✨ *BarberConnect – Connecting Barbers and Customers Seamlessly.*
