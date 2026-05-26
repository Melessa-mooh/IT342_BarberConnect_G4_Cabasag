package edu.cit.cabasag.barberconnect.ui

import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityProfileBinding
import edu.cit.cabasag.barberconnect.model.AuthResponse
import edu.cit.cabasag.barberconnect.model.UpdateBarberProfileRequest
import edu.cit.cabasag.barberconnect.model.UpdateProfileRequest
import edu.cit.cabasag.barberconnect.repository.AuthRepository
import edu.cit.cabasag.barberconnect.repository.BarberRepository
import edu.cit.cabasag.barberconnect.ui.barber.BarberMobileNav
import edu.cit.cabasag.barberconnect.util.TokenManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding
    private lateinit var authRepository: AuthRepository
    private lateinit var barberRepository: BarberRepository
    private lateinit var tokenManager: TokenManager
    private var user: AuthResponse? = null

    private val imagePicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) uploadProfileImage(uri)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val api = (application as BarberConnectApp).retrofitClient.apiService
        tokenManager = TokenManager(this)
        authRepository = AuthRepository(api, tokenManager)
        barberRepository = BarberRepository(api)

        binding.btnSave.setOnClickListener { saveProfile() }
        binding.btnUploadImage.setOnClickListener { imagePicker.launch("image/*") }

        loadProfile()
    }

    private fun loadProfile() {
        lifecycleScope.launch {
            user = authRepository.refreshCurrentUser().getOrElse { tokenManager.getUser().first() }
            populate(user)
        }
    }

    private fun populate(user: AuthResponse?) {
        if (user == null) {
            showStatus("Profile not loaded. Please sign in again.", true)
            return
        }
        binding.etFirstName.setText(user.firstName.orEmpty())
        binding.etLastName.setText(user.lastName.orEmpty())
        binding.etPhone.setText(user.phoneNumber.orEmpty())
        binding.ivProfile.setImageResource(edu.cit.cabasag.barberconnect.R.drawable.ic_scissors)

        val isBarber = user.role.equals("BARBER", ignoreCase = true)
        binding.btnMenu.visibility = if (isBarber) View.VISIBLE else View.GONE
        binding.barberFields.visibility = if (isBarber) View.VISIBLE else View.GONE
        if (isBarber) {
            BarberMobileNav.setup(
                activity = this,
                activeItem = "Profile",
                barberProfileId = user.barberProfile?.id ?: user.resolvedUserId,
                menuButton = binding.btnMenu,
                overlay = binding.drawerOverlay,
                drawer = binding.drawerPanel,
                closeButton = binding.btnCloseDrawer,
                items = listOf(
                    binding.drawerItem1,
                    binding.drawerItem2,
                    binding.drawerItem3,
                    binding.drawerItem4,
                    binding.drawerItem5,
                    binding.drawerItem6,
                    binding.drawerItem7
                ),
                logoutButton = binding.btnLogout
            )
            binding.etBio.setText(user.barberProfile?.bio.orEmpty())
            binding.etExperience.setText(user.barberProfile?.yearsExperience?.toString().orEmpty())
            binding.etGcash.setText(user.barberProfile?.gcashNumber.orEmpty())
            binding.switchAvailable.isChecked = user.barberProfile?.isAvailable ?: true
        }
    }

    private fun saveProfile() {
        val current = user ?: return showStatus("Profile not loaded. Please sign in again.", true)
        val userId = current.resolvedUserId ?: return showStatus("Missing user id. Please sign in again.", true)
        val firstName = binding.etFirstName.text?.toString()?.trim().orEmpty()
        val lastName = binding.etLastName.text?.toString()?.trim().orEmpty()
        if (firstName.length < 2 || lastName.length < 2) {
            showStatus("First and last name must be at least 2 characters.", true)
            return
        }

        setSaving(true)
        lifecycleScope.launch {
            val basic = authRepository.updateProfile(
                UpdateProfileRequest(
                    firstName = firstName,
                    lastName = lastName,
                    phoneNumber = binding.etPhone.text?.toString()?.trim().orEmpty()
                )
            )
            if (basic.isFailure) {
                setSaving(false)
                showStatus(basic.exceptionOrNull()?.message ?: "Failed to save profile.", true)
                return@launch
            }
            val updatedUser = basic.getOrNull()

            if (current.role.equals("BARBER", ignoreCase = true)) {
                val barber = barberRepository.updateBarberProfile(
                    userId,
                    UpdateBarberProfileRequest(
                        phone = binding.etPhone.text?.toString()?.trim().orEmpty(),
                        bio = binding.etBio.text?.toString()?.trim().orEmpty(),
                        experience = binding.etExperience.text?.toString()?.toIntOrNull() ?: 0,
                        gcash = binding.etGcash.text?.toString()?.trim().orEmpty(),
                        isAvailable = binding.switchAvailable.isChecked
                    )
                )
                if (barber.isFailure) {
                    setSaving(false)
                    showStatus(barber.exceptionOrNull()?.message ?: "Failed to save barber profile.", true)
                    return@launch
                }
            }

            user = authRepository.refreshCurrentUser().getOrNull() ?: updatedUser
            populate(user)
            setSaving(false)
            showStatus("Profile updated successfully", false)
        }
    }

    private fun uploadProfileImage(uri: Uri) {
        val current = user ?: return showStatus("Profile not loaded. Please sign in again.", true)
        val userId = current.resolvedUserId ?: return showStatus("Missing user id. Please sign in again.", true)
        setSaving(true)
        lifecycleScope.launch {
            val part = uri.toMultipartPart() ?: run {
                setSaving(false)
                showStatus("Could not read selected image.", true)
                return@launch
            }
            val result = if (current.role.equals("BARBER", ignoreCase = true)) {
                barberRepository.uploadBarberProfilePicture(userId, part)
            } else {
                authRepository.uploadProfileImage(part)
            }
            result.fold(
                onSuccess = {
                    user = authRepository.refreshCurrentUser().getOrNull()
                    populate(user)
                    showStatus("Profile photo updated.", false)
                },
                onFailure = { showStatus(it.message ?: "Image upload failed.", true) }
            )
            setSaving(false)
        }
    }

    private fun Uri.toMultipartPart(): MultipartBody.Part? {
        val cacheFile = File(cacheDir, "profile-upload-${System.currentTimeMillis()}.jpg")
        return try {
            contentResolver.openInputStream(this)?.use { input ->
                cacheFile.outputStream().use { output -> input.copyTo(output) }
            } ?: return null
            val body = cacheFile.asRequestBody("image/*".toMediaTypeOrNull())
            MultipartBody.Part.createFormData("file", cacheFile.name, body)
        } catch (_: Exception) {
            null
        }
    }

    private fun setSaving(saving: Boolean) {
        binding.btnSave.isEnabled = !saving
        binding.btnUploadImage.isEnabled = !saving
        binding.btnSave.text = if (saving) "Saving..." else "Save Profile"
    }

    private fun showStatus(message: String, isError: Boolean) {
        binding.tvStatus.text = message
        binding.tvStatus.setTextColor(getColor(if (isError) edu.cit.cabasag.barberconnect.R.color.error_red else edu.cit.cabasag.barberconnect.R.color.success_blue))
        binding.tvStatus.visibility = View.VISIBLE
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
