package edu.cit.cabasag.barberconnect.viewmodel

import androidx.lifecycle.*
import edu.cit.cabasag.barberconnect.model.*
import edu.cit.cabasag.barberconnect.repository.BarberRepository
import edu.cit.cabasag.barberconnect.util.UiState
import kotlinx.coroutines.launch

class BarberViewModel(private val repository: BarberRepository) : ViewModel() {

    private val _appointments = MutableLiveData<UiState<List<Appointment>>>(UiState.Idle)
    val appointments: LiveData<UiState<List<Appointment>>> = _appointments

    private val _leaveRequests = MutableLiveData<UiState<List<LeaveRequest>>>(UiState.Idle)
    val leaveRequests: LiveData<UiState<List<LeaveRequest>>> = _leaveRequests

    private val _submitLeaveState = MutableLiveData<UiState<LeaveRequest>>(UiState.Idle)
    val submitLeaveState: LiveData<UiState<LeaveRequest>> = _submitLeaveState

    private val _incomeRecords = MutableLiveData<UiState<List<IncomeRecord>>>(UiState.Idle)
    val incomeRecords: LiveData<UiState<List<IncomeRecord>>> = _incomeRecords

    private val _posts = MutableLiveData<UiState<List<Post>>>(UiState.Idle)
    val posts: LiveData<UiState<List<Post>>> = _posts

    private val _createPostState = MutableLiveData<UiState<Post>>(UiState.Idle)
    val createPostState: LiveData<UiState<Post>> = _createPostState

    private val _comments = MutableLiveData<UiState<List<Comment>>>(UiState.Idle)
    val comments: LiveData<UiState<List<Comment>>> = _comments

    private val _commentAdded = MutableLiveData<UiState<Comment>>(UiState.Idle)
    val commentAdded: LiveData<UiState<Comment>> = _commentAdded

    private val _reactionState = MutableLiveData<UiState<Reaction>>(UiState.Idle)
    val reactionState: LiveData<UiState<Reaction>> = _reactionState

    fun loadAppointments(barberProfileId: String) {
        _appointments.value = UiState.Loading
        viewModelScope.launch {
            _appointments.value = repository.getBarberAppointments(barberProfileId).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load appointments") }
            )
        }
    }

    fun loadLeaveRequests(barberProfileId: String) {
        _leaveRequests.value = UiState.Loading
        viewModelScope.launch {
            _leaveRequests.value = repository.getLeaveRequests(barberProfileId).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load leave requests") }
            )
        }
    }

    fun submitLeaveRequest(barberProfileId: String, date: String, reason: String) {
        _submitLeaveState.value = UiState.Loading
        viewModelScope.launch {
            _submitLeaveState.value = repository.submitLeaveRequest(
                barberProfileId, LeaveSubmitRequest(date, reason)
            ).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to submit leave request") }
            )
        }
    }

    fun loadIncomeRecords(barberProfileId: String) {
        _incomeRecords.value = UiState.Loading
        viewModelScope.launch {
            _incomeRecords.value = repository.getIncomeRecords(barberProfileId).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load income") }
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

    fun createPost(barberProfileId: String, content: String) {
        _createPostState.value = UiState.Loading
        viewModelScope.launch {
            _createPostState.value = repository.createPost(barberProfileId, content).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to create post") }
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

    fun resetSubmitLeaveState() { _submitLeaveState.value  = UiState.Idle }
    fun resetCreatePostState()  { _createPostState.value   = UiState.Idle }
    fun resetCommentAdded() { _commentAdded.value = UiState.Idle }
    fun resetReactionState() { _reactionState.value = UiState.Idle }
}

class BarberViewModelFactory(
    private val repository: BarberRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(BarberViewModel::class.java))
            return BarberViewModel(repository) as T
        throw IllegalArgumentException("Unknown ViewModel: ${modelClass.name}")
    }
}
