# Software Design Patterns Research
**Course:** Software Design Patterns
**Project:** BarberConnect Web Application

---

## Part 1: Creational Patterns
Creational patterns abstract the instantiation process, making the system independent of how its objects are created, composed, and represented.

### 1. Builder Pattern
* **Category:** Creational
* **Problem it solves:** Prevents the "Telescoping Constructor" anti-pattern where a class has too many constructors with varying parameters, or when an object requires a complex step-by-step initialization process resulting in massive blocks of setter calls.
* **How it works:** It delegates the object construction logic to a separate `Builder` object. The builder returns itself on every configuration step (fluent interface) and finally builds the immutable object when `.build()` is called.
* **Real-world example:** In the Java ecosystem, standard HTTP Request libraries (like Spring's `WebClient.Builder`) use this pattern to cleanly assemble complex HTTP requests containing various headers, auth tokens, and JSON bodies.
* **Use case in our project:** Creating a clean, immutable `DashboardStatsResponse` Data Transfer Object (DTO) in Spring Boot. Instead of calling seven different setters, we can cleanly build the response object in one chained invocation before sending it to the frontend.

### 2. Factory Method Pattern
* **Category:** Creational
* **Problem it solves:** Solves the problem of creating product objects without specifying their exact concrete classes, especially when the exact class depends on dynamic runtime conditions.
* **How it works:** It defines an interface for creating an object, but lets subclasses essentially decide which class to instantiate. The client code uses the factory interface instead of the `new` keyword.
* **Real-world example:** In a modern UI component library (like React), a `ButtonFactory` might return a deeply customized `PrimaryButton`, `GhostButton`, or `DangerButton` based on a simple "type" string variant passed to a single `<Button />` wrapper.
* **Use case in our project:** A `NotificationFactory` for Firebase Cloud Messaging. Depending on the event (e.g., Appointment Cancelled vs. Appointment Confirmed), it generates specific Push Notification payloads dynamically without hardcoding logic throughout the services.

---

## Part 2: Structural Patterns
Structural patterns focus on how objects and classes are composed to form larger structures while keeping these structures flexible and efficient.

### 3. Facade Pattern
* **Category:** Structural
* **Problem it solves:** Complex subsystems often present a chaotic, heavily coupled web of interfaces. When clients communicate directly with all these intricate components, the system becomes fragile.
* **How it works:** Provides a single, simplified, higher-level unified interface (Facade) to a set of underlying complex system interfaces, hiding the subsystem's complexity.
* **Real-world example:** A "Check-out" button on an e-commerce website. You click one button (the Facade), but underneath, it triggers inventory validation, payment processing securely via Stripe, and shipping confirmation APIs.
* **Use case in our project:** A `BarberDashboardFacade` in the Spring Boot backend. Instead of the REST Controller independently contacting the `AppointmentRepository`, `IncomeRepository`, and `ReviewRepository`, the controller calls the Facade once. The Facade quietly aggregates the data from all three systems and returns a unified model.

### 4. Adapter Pattern
* **Category:** Structural
* **Problem it solves:** Allows incompatible interfaces to collaborate. It acts as a wrapper between two objects that catch calls for one object and transform them directly to a recognizable format for the second object.
* **How it works:** Creates a middle-layer class (Adapter) that implements the target interface and holds an instance of the adaptee. It translates requests from the target interface into a format the adaptee expects.
* **Real-world example:** Creating a generic `PaymentAdapter` to handle legacy internal payment structures while upgrading to a modern payment gateway API like PayPal. The generic code doesn't change, only the adapter bridges the new data format.
* **Use case in our project:** Adapting Firebase raw Authentication Data to our custom `User` entity. When Firebase logs a user in via Google OAuth2, it returns a massive `FirebaseToken`. A `FirebaseUserAdapter` can elegantly map this external payload into our internal `AuthResponse` structure cleanly.

---

## Part 3: Behavioral Patterns
Behavioral patterns are primarily concerned with how objects interact, assigning responsibilities safely, and encapsulating the flow of control.

### 5. Strategy Pattern
* **Category:** Behavioral
* **Problem it solves:** Using massive, messy `if/else` or `switch` statements to select an algorithm (or behavior) dynamically.
* **How it works:** It defines a "family" of algorithms, encapsulates each one inside a separate concrete class that implements a common Strategy interface, and makes them strictly interchangeable at runtime.
* **Real-world example:** Navigation apps like Google Maps. It uses a `RouteStrategy` interface. Depending on what you click, it swaps between `WalkingStrategy`, `DrivingStrategy`, or `TransitStrategy` to calculate distance without clogging the core rendering application.
* **Use case in our project:** Processing different Payment Methods in `AppointmentService`. We define a `PaymentStrategy` interface with `CashPaymentStrategy` and `DigitalWalletStrategy`. When checking out a Barber Appointment, the backend dynamically uses the correct strategy to confirm payment based on `Appointment.PaymentMethod`.

### 6. Observer Pattern
* **Category:** Behavioral
* **Problem it solves:** Defining a one-to-many dependency so that when one object (Subject) changes state, all its dependents (Observers) are notified and automatically updated.
* **How it works:** A Subject maintains a list of dependents (Observers). Whenever a core event occurs, the Subject loops through and calls a notification method on its observers.
* **Real-world example:** A Newsletter Subscription system, or standard JavaScript DOM Event Listeners (`button.addEventListener('click', observeFunction)`).
* **Use case in our project:** Real-time state management using React's `AuthContext` in the BarberConnect frontend. When the authenticated User state changes (e.g. from logged-in to logged-out), the Context (Subject) immediately notifies all nested Dashboard Panels (Observers) to transition into logout mode dynamically across the screen.
