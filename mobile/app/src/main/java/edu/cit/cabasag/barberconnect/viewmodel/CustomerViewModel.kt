package edu.cit.cabasag.barberconnect.viewmodel

import androidx.lifecycle.*
import edu.cit.cabasag.barberconnect.model.*
import edu.cit.cabasag.barberconnect.repository.CustomerRepository
import edu.cit.cabasag.barberconnect.util.UiState
import kotlinx.coroutines.launch

class CustomerViewModel(private val repository: CustomerRepository) : ViewModel() {

    private val _barbers = MutableLiveData<UiState<List<Barber>>>(UiState.Idle)
    val barbers: LiveData<UiState<List<Barber>>> = _barbers

    private val _haircutStyles = MutableLiveData<UiState<List<HaircutStyle>>>(UiState.Idle)
    val haircutStyles: LiveData<UiState<List<HaircutStyle>>> = _haircutStyles

    private val _leaveDates = MutableLiveData<List<String>>(emptyList())
    val leaveDates: LiveData<List<String>> = _leaveDates

    private val _barberAppointments = MutableLiveData<List<Appointment>>(emptyList())
    val barberAppointments: LiveData<List<Appointment>> = _barberAppointments

    private val _bookingState = MutableLiveData<UiState<Appointment>>(UiState.Idle)
    val bookingState: LiveData<UiState<Appointment>> = _bookingState

    private val _myAppointments = MutableLiveData<UiState<List<Appointment>>>(UiState.Idle)
    val myAppointments: LiveData<UiState<List<Appointment>>> = _myAppointments

    private val _feedbackState = MutableLiveData<UiState<Any>>(UiState.Idle)
    val feedbackState: LiveData<UiState<Any>> = _feedbackState

    private val _posts = MutableLiveData<UiState<List<Post>>>(UiState.Idle)
    val posts: LiveData<UiState<List<Post>>> = _posts

    private val _comments = MutableLiveData<UiState<List<Comment>>>(UiState.Idle)
    val comments: LiveData<UiState<List<Comment>>> = _comments

    private val _commentAdded = MutableLiveData<UiState<Comment>>(UiState.Idle)
    val commentAdded: LiveData<UiState<Comment>> = _commentAdded

    private val _reactionState = MutableLiveData<UiState<Reaction>>(UiState.Idle)
    val reactionState: LiveData<UiState<Reaction>> = _reactionState

    fun loadBarbers() {
        _barbers.value = UiState.Loading
        viewModelScope.launch {
            _barbers.value = repository.getAvailableBarbers().fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load barbers") }
            )
        }
    }

    fun loadHaircutStyles(barberProfileId: String) {
        _haircutStyles.value = UiState.Loading
        viewModelScope.launch {
            _haircutStyles.value = repository.getHaircutStyles(barberProfileId).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load styles") }
            )
        }
    }

    fun loadLeaveDates(barberProfileId: String) {
        viewModelScope.launch {
            repository.getApprovedLeaveDates(barberProfileId).onSuccess {
                _leaveDates.value = it
            }
        }
    }

    fun loadBarberAppointments(barberProfileId: String) {
        viewModelScope.launch {
            repository.getBarberAppointments(barberProfileId).onSuccess {
                _barberAppointments.value = it.filter { a -> a.status != "CANCELLED" }
            }
        }
    }

    fun bookAppointment(request: BookingRequest) {
        _bookingState.value = UiState.Loading
        viewModelScope.launch {
            _bookingState.value = repository.bookAppointment(request).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Booking failed") }
            )
        }
    }

    fun loadMyAppointments(customerId: String) {
        _myAppointments.value = UiState.Loading
        viewModelScope.launch {
            _myAppointments.value = repository.getCustomerAppointments(customerId).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load appointments") }
            )
        }
    }

    fun submitFeedback(request: FeedbackRequest) {
        _feedbackState.value = UiState.Loading
        viewModelScope.launch {
            _feedbackState.value = repository.submitFeedback(request).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to submit feedback") }
            )
        }
    }

    fun loadPosts() {
        _posts.value = UiState.Loading
        viewModelScope.launch {
            _posts.value = repository.getAllPosts().fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load feed") }
            )
        }
    }

    fun loadComments(postId: String) {
        _comments.value = UiState.Loading
        viewModelScope.launch {
            _comments.value = repository.getComments(postId).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load comments") }
            )
        }
    }

    fun addComment(postId: String, userId: String, content: String) {
        _commentAdded.value = UiState.Loading
        viewModelScope.launch {
            _commentAdded.value = repository.addComment(postId, userId, content).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to add comment") }
            )
        }
    }

    fun addReaction(postId: String, userId: String, type: String = "LIKE") {
        _reactionState.value = UiState.Loading
        viewModelScope.launch {
            _reactionState.value = repository.addReaction(postId, userId, type).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to react") }
            )
        }
    }

    fun resetBookingState()  { _bookingState.value  = UiState.Idle }
    fun resetFeedbackState() { _feedbackState.value = UiState.Idle }
    fun resetCommentAdded() { _commentAdded.value = UiState.Idle }
    fun resetReactionState() { _reactionState.value = UiState.Idle }
}

class CustomerViewModelFactory(
    private val repository: CustomerRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(CustomerViewModel::class.java))
            return CustomerViewModel(repository) as T
        throw IllegalArgumentException("Unknown ViewModel: ${modelClass.name}")
    }
}
