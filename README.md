# BarberConnect ✂️

BarberConnect is a full-stack barbershop management system that we built to create a seamless booking and management experience for both barbers and customers.

## 🌟 Our Journey: What We Did

Throughout the development of BarberConnect (especially during IT342 Phase 2), we worked hands-on to turn our initial concept into a fully functioning platform. Here are the core features and implementations we personally built:

### 📱 The Mobile Experience (Android / Kotlin)
- **Premium UI/UX:** We designed a custom, Nike-inspired "barber-themed" aesthetic. We made sure buttons have smooth transitions, and the interface feels high-end, dynamic, and responsive.
- **Clean Architecture:** Engineered the Android app using **MVVM (Model-View-ViewModel)** alongside Coroutines and Retrofit so the code stays deeply organized.
- **Authentication:** Integrated Google Firebase alongside our custom Spring Boot backend for secure login and registration flows.
- **State Management:** Carefully managed UI states (Loading, Success, Error) to give users proper visual feedback during API interactions.

### 💻 The Web Dashboard
- **Dynamic Appointments:** Built a fully interactive, Firestore-backed appointment calendar from scratch specifically for the user dashboard.
- **Profile Enhancements:** Implemented secure profile picture uploads that sync directly to Firebase Storage.
- **Data Formatting:** Created utilities to format currencies properly locally (Philippine Pesos - PHP) and mapped internal technical database IDs into human-readable labels so the UI is intuitive.

### 🔐 Security & Infrastructure
- Cleaned up our repository by systematically analyzing and configuring our `.gitignore`, ensuring sensitive files like `google-services.json`, `local.properties`, and Gradle build caches are completely hidden from source control.

---

## 🏗️ The Foundation: What the System Handles

We chose a robust baseline tech stack that provides incredible out-of-the-box infrastructure, letting us focus on the custom features:

- **Spring Boot (Java 17):** Provides our core layered architecture (Controller → Service → Repository). It shoulders the heavy lifting for dependency injection, RESTful API mapping, and our Global Exception Handling.
- **Database (MySQL):** Handles our persistent relational queries (users, sessions, appointments).
- **Security Protocols:** Utilizing system-generated JWT tokens for stateless session management and BCrypt for secure, out-of-the-box password hashing.
- **Third-Party Services:** 
  - **Firebase:** Facilitates our OAuth2 flows and scalable image storage backend.
  - **Stripe Sandbox:** Seamlessly manages the complexities and security of processing mock payments.
  - **SMTP:** Fires off automated booking confirmations and welcome emails.

---

## 🚀 Key Platform Features

- **For Customers:** Register and login securely, book and cancel appointments seamlessly, pay securely via Stripe, and track your booking history.
- **For Barbers:** Manage grooming services, upload showcase images, accept or update new bookings smoothly.
- **External Integrations:** Dashboard displays useful external public APIs (like local weather) completely insulated with graceful fallback handlers.

---

## 🛠 Technology Stack
- **Backend:** Spring Boot (Java), MySQL, JWT, BCrypt
- **Mobile Application:** Android / Kotlin
- **Web Application:** HTML, JS, Vanilla CSS
- **Cloud & Microservices:** Firebase (Auth & Storage), Stripe (Sandbox Dashboard), SMTP Mail Server

---

## 📦 Getting Started

### 1️⃣ Backend Setup
1. Clone the repository.
2. Provide your own `application.properties` with appropriate environment variables containing your MySQL, JWT, Stripe, SMTP, and Firebase credentials.
3. Run the Spring Boot application (by default runs on `localhost:8080`).

### 2️⃣ Mobile App Setup
1. Open the `/mobile` project folder in Android Studio.
2. Note: You will need to create and add your own `google-services.json` inside the `mobile/app` directory (this is intentionally ignored in version control).
3. Sync Gradle and run the app on an Android emulator or a physical device.

### 3️⃣ Web Setup
1. Navigate to the `web` directory.
2. Ensure you have mapped your backend API correctly inside your frontend scripts.
3. Serve locally (using an extension like Live Server in VS Code) and open in your browser.

---

## 📄 License & Credits
Designed and developed for academic requirements (Project Individual) showcasing modern software engineering practices.

**Author:** Cabasag, Ma. Melessa V.

✨ *BarberConnect – Connecting Barbers and Customers Seamlessly.*