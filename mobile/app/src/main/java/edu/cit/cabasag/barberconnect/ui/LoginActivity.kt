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
import edu.cit.cabasag.barberconnect.databinding.ActivityLoginBinding
import edu.cit.cabasag.barberconnect.network.RetrofitClient
import edu.cit.cabasag.barberconnect.repository.AuthRepository
import edu.cit.cabasag.barberconnect.util.TokenManager
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.AuthViewModel
import edu.cit.cabasag.barberconnect.viewmodel.AuthViewModelFactory

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var viewModel: AuthViewModel
    private lateinit var googleSignInClient: GoogleSignInClient
    private lateinit var firebaseAuth: FirebaseAuth

    // ── Google Sign-In result launcher ─────────────────────────────────────
    private val googleSignInLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result: ActivityResult ->
            handleGoogleSignInResult(result)
        }

    // ── Lifecycle ──────────────────────────────────────────────────────────

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViewModel()
        setupGoogleSignIn()
        setupObservers()
        setupClickListeners()

        // Show success message if coming from successful registration
        intent.getStringExtra(EXTRA_MESSAGE)?.let { showSuccess(it) }
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
        viewModel.loginState.observe(this) { state ->
            when (state) {
                is UiState.Loading -> setLoading(true)
                is UiState.Success -> {
                    setLoading(false)
                    navigateToDashboard()
                }
                is UiState.Error -> {
                    setLoading(false)
                    showError(state.message)
                }
                is UiState.Idle -> setLoading(false)
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnLogin.setOnClickListener { attemptLogin() }
        binding.btnGoogleLogin.setOnClickListener { launchGoogleSignIn() }
        binding.tvSignUp.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    // ── Login ──────────────────────────────────────────────────────────────

    private fun attemptLogin() {
        val email    = binding.etEmail.text?.toString()?.trim() ?: ""
        val password = binding.etPassword.text?.toString() ?: ""

        // Clear previous errors
        binding.tilEmail.error    = null
        binding.tilPassword.error = null
        hideError()

        var valid = true
        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = "Please enter a valid email address"
            valid = false
        }
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password is required"
            valid = false
        }

        if (valid) viewModel.login(email, password)
    }

    // ── Google Sign-In ─────────────────────────────────────────────────────

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
                showError("Google Sign-In failed: no token received.")
                return
            }
            firebaseSignIn(idToken)
        } catch (e: ApiException) {
            showError("Google Sign-In cancelled or failed (code ${e.statusCode}).")
        }
    }

    private fun firebaseSignIn(googleIdToken: String) {
        setLoading(true)
        val credential = GoogleAuthProvider.getCredential(googleIdToken, null)
        firebaseAuth.signInWithCredential(credential)
            .addOnSuccessListener { authResult ->
                authResult.user?.getIdToken(true)
                    ?.addOnSuccessListener { tokenResult ->
                        val firebaseIdToken = tokenResult.token ?: ""
                        viewModel.loginWithFirebase(firebaseIdToken)
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

    private fun navigateToDashboard() {
        startActivity(Intent(this, DashboardActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
        finish()
    }

    private fun setLoading(loading: Boolean) {
        binding.btnLogin.isEnabled       = !loading
        binding.btnGoogleLogin.isEnabled = !loading
        binding.btnLogin.text = if (loading) getString(R.string.signing_in) else getString(R.string.sign_in)
    }

    private fun showError(msg: String) {
        binding.tvError.text       = msg
        binding.tvError.visibility = View.VISIBLE
        binding.tvSuccess.visibility = View.GONE
    }

    private fun hideError() {
        binding.tvError.visibility = View.GONE
    }

    private fun showSuccess(msg: String) {
        binding.tvSuccess.text       = msg
        binding.tvSuccess.visibility = View.VISIBLE
        binding.tvError.visibility   = View.GONE
    }

    // ── Companion ──────────────────────────────────────────────────────────

    companion object {
        const val EXTRA_MESSAGE = "extra_message"
    }
}
