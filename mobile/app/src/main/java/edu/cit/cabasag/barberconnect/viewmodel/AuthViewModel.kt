package edu.cit.cabasag.barberconnect.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import edu.cit.cabasag.barberconnect.model.AuthResponse
import edu.cit.cabasag.barberconnect.model.LoginRequest
import edu.cit.cabasag.barberconnect.model.RegisterRequest
import edu.cit.cabasag.barberconnect.repository.AuthRepository
import edu.cit.cabasag.barberconnect.util.UiState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch

class AuthViewModel(private val repository: AuthRepository) : ViewModel() {

    //Login
    private val _loginState = MutableLiveData<UiState<AuthResponse>>(UiState.Idle)
    val loginState: LiveData<UiState<AuthResponse>> = _loginState

    // Register
    private val _registerState = MutableLiveData<UiState<AuthResponse>>(UiState.Idle)
    val registerState: LiveData<UiState<AuthResponse>> = _registerState

    // ── Logout
    private val _loggedOut = MutableLiveData(false)
    val loggedOut: LiveData<Boolean> = _loggedOut

    // Actions

    fun login(email: String, password: String) {
        _loginState.value = UiState.Loading
        viewModelScope.launch {
            val result = repository.login(LoginRequest(email, password))
            _loginState.value = result.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Login failed") }
            )
        }
    }

    fun register(firstName: String, lastName: String, email: String, password: String, role: String) {
        _registerState.value = UiState.Loading
        viewModelScope.launch {
            val result = repository.register(
                RegisterRequest(firstName, lastName, email, password, role)
            )
            _registerState.value = result.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Registration failed") }
            )
        }
    }

    fun loginWithFirebase(idToken: String) {
        _loginState.value = UiState.Loading
        viewModelScope.launch {
            val result = repository.loginWithFirebase(idToken)
            _loginState.value = result.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Google Sign-In failed") }
            )
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _loggedOut.value = true
        }
    }

    fun resetLoginState()    { _loginState.value    = UiState.Idle }
    fun resetRegisterState() { _registerState.value = UiState.Idle }

    fun getToken(): Flow<String?>       = repository.getToken()
    fun getUser():  Flow<AuthResponse?> = repository.getUser()
}

//Factory
class AuthViewModelFactory(private val repository: AuthRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AuthViewModel::class.java))
            return AuthViewModel(repository) as T
        throw IllegalArgumentException("Unknown ViewModel: ${modelClass.name}")
    }
}
