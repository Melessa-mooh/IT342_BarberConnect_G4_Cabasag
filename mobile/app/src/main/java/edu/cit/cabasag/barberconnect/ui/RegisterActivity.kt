package edu.cit.cabasag.barberconnect.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import edu.cit.cabasag.barberconnect.R
import edu.cit.cabasag.barberconnect.databinding.ActivityRegisterBinding
import edu.cit.cabasag.barberconnect.network.RetrofitClient
import edu.cit.cabasag.barberconnect.repository.AuthRepository
import edu.cit.cabasag.barberconnect.util.TokenManager
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.AuthViewModel
import edu.cit.cabasag.barberconnect.viewmodel.AuthViewModelFactory

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var viewModel: AuthViewModel
    private lateinit var googleSignInClient: GoogleSignInClient
    private lateinit var firebaseAuth: FirebaseAuth

    private val googleSignInLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result: ActivityResult ->
            handleGoogleSignInResult(result)
        }

    // ── Lifecycle ──────────────────────────────────────────────────────────

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViewModel()
        setupGoogleSignIn()
        setupObservers()
        setupClickListeners()
    }

    // ── Setup ──────────────────────────────────────────────────────────────

    private fun setupViewModel() {
        val tokenManager = TokenManager(this)
        val repository   = AuthRepository(RetrofitClient.apiService, tokenManager)
        viewModel = ViewModelProvider(this, AuthViewModelFactory(repository))[AuthViewModel::class.java]
    }

    private fun setupGoogleSignIn() {
        firebaseAuth = FirebaseAuth.getInstance()
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)
    }

    private fun setupObservers() {
        viewModel.registerState.observe(this) { state ->
            when (state) {
                is UiState.Loading -> setLoading(true)
                is UiState.Success -> {
                    setLoading(false)
                    // Navigate to Login with success banner (mirrors web behaviour)
                    val intent = Intent(this, LoginActivity::class.java).apply {
                        putExtra(LoginActivity.EXTRA_MESSAGE, "Registration successful! Please sign in.")
                        flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                    }
                    startActivity(intent)
                    finish()
                }
                is UiState.Error -> {
                    setLoading(false)
                    showError(state.message)
                }
                is UiState.Idle -> setLoading(false)
            }
        }

        // Google sign-up also shares loginState
        viewModel.loginState.observe(this) { state ->
            when (state) {
                is UiState.Loading -> setLoading(true)
                is UiState.Success -> {
                    setLoading(false)
                    startActivity(
                        Intent(this, DashboardActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        }
                    )
                    finish()
                }
                is UiState.Error -> {
                    setLoading(false)
                    showError(state.message)
                }
                else -> setLoading(false)
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnRegister.setOnClickListener { attemptRegister() }
        binding.btnGoogleRegister.setOnClickListener { launchGoogleSignIn() }
        binding.tvSignIn.setOnClickListener { finish() } // back to Login
    }

    // ── Register ───────────────────────────────────────────────────────────

    private fun attemptRegister() {
        val firstName       = binding.etFirstName.text?.toString()?.trim() ?: ""
        val lastName        = binding.etLastName.text?.toString()?.trim() ?: ""
        val email           = binding.etEmail.text?.toString()?.trim() ?: ""
        val password        = binding.etPassword.text?.toString() ?: ""
        val confirmPassword = binding.etConfirmPassword.text?.toString() ?: ""
        val role            = if (binding.rbBarber.isChecked) "BARBER" else "CUSTOMER"

        // Clear previous errors
        binding.tilFirstName.error       = null
        binding.tilLastName.error        = null
        binding.tilEmail.error           = null
        binding.tilPassword.error        = null
        binding.tilConfirmPassword.error = null
        hideError()

        var valid = true

        if (firstName.length < 2 || !firstName.all { it.isLetter() || it.isWhitespace() }) {
            binding.tilFirstName.error = "First name must be at least 2 letters"
            valid = false
        }
        if (lastName.length < 2 || !lastName.all { it.isLetter() || it.isWhitespace() }) {
            binding.tilLastName.error = "Last name must be at least 2 letters"
            valid = false
        }
        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = "Please enter a valid email address"
            valid = false
        }
        if (password.length < 8) {
            binding.tilPassword.error = "Password must be at least 8 characters"
            valid = false
        }
        if (confirmPassword != password) {
            binding.tilConfirmPassword.error = "Passwords do not match"
            valid = false
        }

        if (valid) viewModel.register(firstName, lastName, email, password, role)
    }

    // ── Google Sign-Up ─────────────────────────────────────────────────────

    private fun launchGoogleSignIn() {
        googleSignInClient.signOut().addOnCompleteListener {
            googleSignInLauncher.launch(googleSignInClient.signInIntent)
        }
    }

    private fun handleGoogleSignInResult(result: ActivityResult) {
        try {
            val account = GoogleSignIn.getSignedInAccountFromIntent(result.data)
                .getResult(ApiException::class.java)
            val idToken = account.idToken ?: run {
                showError("Google Sign-Up failed: no token received.")
                return
            }
            firebaseSignIn(idToken)
        } catch (e: ApiException) {
            showError("Google Sign-Up cancelled or failed (code ${e.statusCode}).")
        }
    }

    private fun firebaseSignIn(googleIdToken: String) {
        setLoading(true)
        val credential = GoogleAuthProvider.getCredential(googleIdToken, null)
        firebaseAuth.signInWithCredential(credential)
            .addOnSuccessListener { authResult ->
                authResult.user?.getIdToken(true)
                    ?.addOnSuccessListener { tokenResult ->
                        viewModel.loginWithFirebase(tokenResult.token ?: "")
                    }
                    ?.addOnFailureListener { e ->
                        setLoading(false)
                        showError(e.message ?: "Firebase token error.")
                    }
            }
            .addOnFailureListener { e ->
                setLoading(false)
                showError(e.message ?: "Firebase sign-in failed.")
            }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private fun setLoading(loading: Boolean) {
        binding.btnRegister.isEnabled       = !loading
        binding.btnGoogleRegister.isEnabled = !loading
        binding.btnRegister.text = if (loading)
            getString(R.string.creating_account) else getString(R.string.sign_up)
    }

    private fun showError(msg: String) {
        binding.tvError.text       = msg
        binding.tvError.visibility = View.VISIBLE
    }

    private fun hideError() {
        binding.tvError.visibility = View.GONE
    }
}
