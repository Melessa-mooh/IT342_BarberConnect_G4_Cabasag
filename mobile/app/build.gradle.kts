plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")
}

android {
    namespace = "edu.cit.cabasag.barberconnect"
    compileSdk = 34

    defaultConfig {
        applicationId = "edu.cit.cabasag.barberconnect"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Debug default is the Android emulator loopback.
        // Real device testing: override with -PBASE_URL=http://<PC_LOCAL_IP>:8080/api/v1/
        // Release/deployed builds should pass -PBASE_URL=https://<deployed-backend>/api/v1/
        val configuredBaseUrl = providers.gradleProperty("BASE_URL")
            .orElse("http://10.0.2.2:8080/api/v1/")
            .get()
        buildConfigField("String", "BASE_URL", "\"$configuredBaseUrl\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            val configuredBaseUrl = providers.gradleProperty("BASE_URL")
                .orElse("https://your-production-url.com/api/v1/")
                .get()
            buildConfigField("String", "BASE_URL", "\"$configuredBaseUrl\"")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

// ── Decouple unit tests from processGoogleServices ────────────────────────────
// processDebugGoogleServices requires google-services.json which is gitignored.
// Unit tests (testDebugUnitTest) run on the JVM and don't need Firebase at all.
// We make the task do nothing when google-services.json is absent so that
// `gradle testDebugUnitTest` works in CI without the real credentials file.
afterEvaluate {
    tasks.matching { it.name.startsWith("processDebugGoogleServices") }.configureEach {
        val gsFile = project.file("google-services.json")
        if (!gsFile.exists()) {
            enabled = false
            logger.warn("google-services.json not found — skipping ${this.name} for unit tests.")
        }
    }
}

dependencies {
    // Android Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.core:core-splashscreen:1.0.1")

    // ViewModel + LiveData + Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-ktx:1.8.2")

    // Retrofit + OkHttp
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // DataStore Preferences
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Firebase BOM + Auth
    implementation(platform("com.google.firebase:firebase-bom:32.7.2"))
    implementation("com.google.firebase:firebase-auth-ktx")

    // Google Sign-In
    implementation("com.google.android.gms:play-services-auth:21.0.0")

    // Gson
    implementation("com.google.code.gson:gson:2.10.1")

    // Image loading
    implementation("com.github.bumptech.glide:glide:4.16.0")

    // Tests — JUnit + Mockito (unit tests, no emulator needed)
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.11.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.3.1")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("androidx.arch.core:core-testing:2.2.0")

    // Instrumented tests (Espresso — requires emulator/device)
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.test.espresso:espresso-contrib:3.5.1")
    androidTestImplementation("androidx.test:runner:1.5.2")
    androidTestImplementation("androidx.test:rules:1.5.0")
}
