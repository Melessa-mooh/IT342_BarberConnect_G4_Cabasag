package edu.cit.cabasag.barberconnect.ui.barber

import android.content.res.ColorStateList
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.text.InputType
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityBarberCatalogBinding
import edu.cit.cabasag.barberconnect.model.HaircutStyle
import edu.cit.cabasag.barberconnect.repository.BarberRepository
import edu.cit.cabasag.barberconnect.ui.adapter.HaircutStyleAdapter
import edu.cit.cabasag.barberconnect.util.HaircutImageFallback
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModel
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModelFactory
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

class BarberCatalogActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBarberCatalogBinding
    private lateinit var viewModel: BarberViewModel
    private lateinit var adapter: HaircutStyleAdapter
    private var pendingStyleImageUri: Uri? = null
    private var pendingStylePreview: ImageView? = null
    private var pendingStyleRemoveButton: Button? = null

    private val styleImagePicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        pendingStyleImageUri = uri
        pendingStylePreview?.visibility = if (uri != null) View.VISIBLE else View.GONE
        pendingStyleRemoveButton?.visibility = if (uri != null) View.VISIBLE else View.GONE
        if (uri != null) pendingStylePreview?.setImageURI(uri)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBarberCatalogBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val barberProfileId = intent.getStringExtra("barberProfileId").orEmpty()
        BarberMobileNav.setup(
            activity = this,
            activeItem = "Haircut Catalog",
            barberProfileId = barberProfileId,
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

        val api = (application as BarberConnectApp).retrofitClient.apiService
        viewModel = ViewModelProvider(
            this,
            BarberViewModelFactory(BarberRepository(api))
        )[BarberViewModel::class.java]

        adapter = HaircutStyleAdapter(
            showManageActions = true,
            onEdit = { style -> showStyleDialog(barberProfileId, style) },
            onDelete = { style -> confirmDelete(style) },
            onSelect = { style -> Toast.makeText(this, style.name ?: "Haircut style", Toast.LENGTH_SHORT).show() }
        )
        binding.recyclerCatalog.layoutManager = LinearLayoutManager(this)
        binding.recyclerCatalog.adapter = adapter

        binding.btnAddStyle.setOnClickListener { showStyleDialog(barberProfileId, null) }
        observeCatalog()

        if (barberProfileId.isBlank()) {
            showMessage("Your barber profile is not loaded yet. Please sign in again.")
        } else {
            viewModel.loadHaircutStyles(barberProfileId)
        }
    }

    private fun observeCatalog() {
        viewModel.haircutStyles.observe(this) { state ->
            when (state) {
                is UiState.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.tvMessage.visibility = View.GONE
                }
                is UiState.Success -> {
                    binding.progressBar.visibility = View.GONE
                    val styles = state.data
                    adapter.submitList(styles)
                    if (styles.isEmpty()) {
                        showMessage("No haircut styles yet.")
                    } else {
                        binding.tvMessage.visibility = View.GONE
                    }
                }
                is UiState.Error -> {
                    binding.progressBar.visibility = View.GONE
                    showMessage(state.message)
                }
                else -> Unit
            }
        }

        viewModel.catalogMutationState.observe(this) { state ->
            when (state) {
                is UiState.Loading -> {
                    binding.tvMutationMessage.text = "Saving catalog changes..."
                }
                is UiState.Success -> {
                    binding.tvMutationMessage.text = state.data
                    Toast.makeText(this, state.data, Toast.LENGTH_SHORT).show()
                    val barberProfileId = intent.getStringExtra("barberProfileId").orEmpty()
                    if (barberProfileId.isNotBlank()) viewModel.loadHaircutStyles(barberProfileId)
                    viewModel.resetCatalogMutationState()
                }
                is UiState.Error -> {
                    binding.tvMutationMessage.text = state.message
                    Toast.makeText(this, state.message, Toast.LENGTH_SHORT).show()
                    viewModel.resetCatalogMutationState()
                }
                else -> Unit
            }
        }
    }

    private fun showMessage(message: String) {
        binding.tvMessage.text = message
        binding.tvMessage.visibility = View.VISIBLE
    }

    private fun showStyleDialog(barberProfileId: String, style: HaircutStyle?) {
        if (barberProfileId.isBlank()) {
            Toast.makeText(this, "Your barber profile is not loaded yet.", Toast.LENGTH_SHORT).show()
            return
        }
        pendingStyleImageUri = null

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 16, 48, 0)
            setBackgroundColor(Color.WHITE)
        }
        val name = input("Style name", style?.name.orEmpty())
        val description = input("Description", style?.description.orEmpty())
        val price = input("Price", style?.basePrice?.toString().orEmpty(), InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL)
        val duration = input("Duration minutes", style?.durationMinutes?.toString().orEmpty(), InputType.TYPE_CLASS_NUMBER)

        val preview = ImageView(this).apply {
            visibility = View.GONE
            scaleType = ImageView.ScaleType.CENTER_CROP
            adjustViewBounds = true
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                resources.displayMetrics.density.times(160).toInt()
            ).apply { setMargins(0, 20, 0, 12) }
            setBackgroundColor(Color.parseColor("#F3F4F6"))
        }
        pendingStylePreview = preview

        val chooseImage = Button(this).apply {
            text = "Choose Image"
            setTextColor(Color.WHITE)
            backgroundTintList = ColorStateList.valueOf(Color.parseColor("#F97316"))
            setOnClickListener { styleImagePicker.launch("image/*") }
        }
        val removeImage = Button(this).apply {
            text = "Remove Selected Image"
            visibility = View.GONE
            setTextColor(Color.parseColor("#374151"))
            backgroundTintList = ColorStateList.valueOf(Color.parseColor("#E5E7EB"))
            setOnClickListener {
                pendingStyleImageUri = null
                preview.setImageDrawable(null)
                preview.visibility = View.GONE
                visibility = View.GONE
            }
        }
        pendingStyleRemoveButton = removeImage

        if (style != null) {
            val fallback = HaircutImageFallback.defaultDrawable(style.name)
            val remoteUrl = HaircutImageFallback.usableRemoteUrl(style)
            preview.visibility = View.VISIBLE
            Glide.with(preview)
                .load(remoteUrl ?: fallback)
                .placeholder(fallback)
                .error(fallback)
                .centerCrop()
                .into(preview)
        }

        listOf(name, description, price, duration).forEach { container.addView(it) }
        container.addView(preview)
        if (style == null) {
            container.addView(chooseImage)
            container.addView(removeImage)
        } else {
            container.addView(TextView(this).apply {
                text = "Existing image will be kept."
                setTextColor(Color.parseColor("#6B7280"))
                textSize = 13f
                setPadding(0, 0, 0, 8)
            })
        }

        val dialog = AlertDialog.Builder(this)
            .setTitle(if (style == null) "Add Style" else "Edit Style")
            .setView(container)
            .setNegativeButton("Cancel", null)
            .setPositiveButton(if (style == null) "Create" else "Save", null)
            .create()

        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(Color.parseColor("#F97316"))
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(Color.parseColor("#6B7280"))
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val styleName = name.text.toString().trim()
                val styleDescription = description.text.toString().trim()
                val basePrice = price.text.toString().toDoubleOrNull()
                val durationMinutes = duration.text.toString().toIntOrNull()
                if (styleName.isBlank() || basePrice == null || durationMinutes == null) {
                    Toast.makeText(this, "Enter a name, price, and duration.", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }
                if (style == null) {
                    viewModel.createHaircutStyle(
                        barberProfileId,
                        styleName,
                        styleDescription,
                        basePrice,
                        durationMinutes,
                        pendingStyleImageUri?.toMultipartPart("file", "haircut-style")
                    )
                } else {
                    viewModel.updateHaircutStyle(style, styleName, styleDescription, basePrice, durationMinutes)
                }
                dialog.dismiss()
            }
        }
        dialog.show()
    }

    private fun confirmDelete(style: HaircutStyle) {
        AlertDialog.Builder(this)
            .setTitle("Delete Style")
            .setMessage("Delete ${style.name ?: "this style"} from your catalog?")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Delete") { _, _ -> viewModel.deleteHaircutStyle(style) }
            .show()
    }

    private fun input(hint: String, value: String, type: Int = InputType.TYPE_CLASS_TEXT): EditText =
        EditText(this).apply {
            this.hint = hint
            setText(value)
            inputType = type
            setTextColor(Color.parseColor("#111827"))
            setHintTextColor(Color.parseColor("#6B7280"))
            backgroundTintList = ColorStateList.valueOf(Color.parseColor("#9CA3AF"))
            setPadding(0, 8, 0, 8)
        }

    private fun Uri.toMultipartPart(fieldName: String, prefix: String): MultipartBody.Part? {
        val cacheFile = File(cacheDir, "$prefix-upload-${System.currentTimeMillis()}.jpg")
        return try {
            contentResolver.openInputStream(this)?.use { input ->
                cacheFile.outputStream().use { output -> input.copyTo(output) }
            } ?: return null
            val body = cacheFile.asRequestBody("image/*".toMediaTypeOrNull())
            MultipartBody.Part.createFormData(fieldName, cacheFile.name, body)
        } catch (_: Exception) {
            null
        }
    }
}
