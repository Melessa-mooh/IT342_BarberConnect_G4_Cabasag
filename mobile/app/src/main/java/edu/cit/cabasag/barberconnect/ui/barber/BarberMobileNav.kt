package edu.cit.cabasag.barberconnect.ui.barber

import android.app.Activity
import android.content.Intent
import android.graphics.drawable.GradientDrawable
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import edu.cit.cabasag.barberconnect.R
import edu.cit.cabasag.barberconnect.ui.DashboardActivity
import edu.cit.cabasag.barberconnect.ui.LoginActivity
import edu.cit.cabasag.barberconnect.ui.ProfileActivity
import edu.cit.cabasag.barberconnect.util.TokenManager
import kotlinx.coroutines.launch

object BarberMobileNav {
    fun setup(
        activity: AppCompatActivity,
        activeItem: String,
        barberProfileId: String?,
        menuButton: TextView,
        overlay: View,
        drawer: View,
        closeButton: TextView,
        items: List<TextView>,
        logoutButton: TextView
    ) {
        val navItems = listOf(
            "Overview" to { activity.openDashboard() },
            "Schedule" to { activity.openBarber<BarberScheduleActivity>(barberProfileId) },
            "Haircut Catalog" to { activity.openBarber<BarberCatalogActivity>(barberProfileId) },
            "Social Feed" to { activity.openBarber<BarberFeedActivity>(barberProfileId) },
            "Income Analytics" to { activity.openBarber<BarberIncomeActivity>(barberProfileId) },
            "Ratings" to { activity.openDashboard() },
            "Profile" to { activity.startActivity(Intent(activity, ProfileActivity::class.java)) }
        )

        items.forEachIndexed { index, textView ->
            val item = navItems.getOrNull(index)
            if (item == null) {
                textView.visibility = View.GONE
                return@forEachIndexed
            }
            val (label, action) = item
            textView.visibility = View.VISIBLE
            textView.text = label
            textView.setTextColor(activity.getColor(if (label == activeItem) R.color.orange_accent else R.color.white))
            textView.background = if (label == activeItem) activity.roundedNavDrawable() else null
            textView.setOnClickListener {
                closeDrawer(activity, overlay, drawer)
                action()
            }
        }

        menuButton.setOnClickListener { openDrawer(activity, overlay, drawer) }
        closeButton.setOnClickListener { closeDrawer(activity, overlay, drawer) }
        overlay.setOnClickListener { closeDrawer(activity, overlay, drawer) }
        logoutButton.setOnClickListener {
            activity.lifecycleScope.launch {
                TokenManager(activity).clearAll()
                activity.startActivity(
                    Intent(activity, LoginActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    }
                )
                activity.finish()
            }
        }
    }

    private inline fun <reified T : Activity> AppCompatActivity.openBarber(barberProfileId: String?) {
        startActivity(Intent(this, T::class.java).apply { putExtra("barberProfileId", barberProfileId) })
    }

    private fun AppCompatActivity.openDashboard() {
        startActivity(
            Intent(this, DashboardActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
        )
    }

    private fun openDrawer(activity: Activity, overlay: View, drawer: View) {
        overlay.alpha = 0f
        overlay.visibility = View.VISIBLE
        drawer.visibility = View.VISIBLE
        drawer.post {
            drawer.translationX = drawer.width.toFloat()
            overlay.animate().alpha(1f).setDuration(140).start()
            drawer.animate().translationX(0f).setDuration(180).start()
        }
    }

    private fun closeDrawer(activity: Activity, overlay: View, drawer: View) {
        val offscreen = drawer.width.toFloat().takeIf { it > 0f } ?: (300f * activity.resources.displayMetrics.density)
        overlay.animate()
            .alpha(0f)
            .setDuration(120)
            .withEndAction { overlay.visibility = View.GONE }
            .start()
        drawer.animate()
            .translationX(offscreen)
            .setDuration(160)
            .withEndAction {
                drawer.visibility = View.GONE
                drawer.translationX = 0f
            }
            .start()
    }

    private fun Activity.roundedNavDrawable() = GradientDrawable().apply {
        cornerRadius = resources.displayMetrics.density * 10
        setColor(getColor(R.color.sidebar_active_bg))
    }
}
