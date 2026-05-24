package edu.cit.cabasag.barberconnect.ui.adapter

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.cit.cabasag.barberconnect.databinding.ItemAppointmentBinding
import edu.cit.cabasag.barberconnect.model.Appointment
import java.text.SimpleDateFormat
import java.util.*

class AppointmentAdapter(
    private val onFeedback: ((Appointment) -> Unit)? = null,
    private val onComplete: ((Appointment) -> Unit)? = null
) : ListAdapter<Appointment, AppointmentAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val b: ItemAppointmentBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(appt: Appointment) {
            // Format date/time
            val rawDt = appt.appointmentDateTime ?: ""
            val displayDt = try {
                val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                val d = sdf.parse(rawDt.take(19))
                if (d != null) SimpleDateFormat("MMM d, yyyy  h:mm a", Locale.getDefault()).format(d)
                else rawDt
            } catch (_: Exception) { rawDt }

            b.tvApptDateTime.text = displayDt
            val displayPerson = if (onComplete != null) {
                appt.customerFullName ?: appt.barberFullName
            } else {
                appt.barberFullName ?: appt.customerFullName
            } ?: "Appointment"
            val displayService = appt.serviceName?.takeIf { it.isNotBlank() } ?: "Haircut Service"
            b.tvApptBarber.text = "$displayPerson - $displayService"
            b.tvApptPrice.text    = "₱${"%.2f".format(appt.totalPrice ?: 0.0)}  •  ${appt.paymentMethod ?: ""}"

            // Status badge
            val status = appt.status ?: "UNKNOWN"
            b.tvApptStatus.text = status
            val (bgColor, textColor) = when (status) {
                "PENDING"     -> "#FFF3CD" to "#856404"
                "CONFIRMED"   -> "#CCE5FF" to "#004085"
                "COMPLETED"   -> "#D4EDDA" to "#155724"
                "CANCELLED",
                "NO_SHOW"     -> "#F8D7DA" to "#721C24"
                else          -> "#E2E3E5" to "#383D41"
            }
            b.tvApptStatus.setBackgroundColor(Color.parseColor(bgColor))
            b.tvApptStatus.setTextColor(Color.parseColor(textColor))

            // Feedback button — only for COMPLETED
            if (status == "COMPLETED" && onFeedback != null) {
                b.btnFeedback.visibility = View.VISIBLE
                b.btnFeedback.setOnClickListener { onFeedback.invoke(appt) }
            } else {
                b.btnFeedback.visibility = View.GONE
            }

            if ((status == "CONFIRMED" || status == "IN_PROGRESS") && onComplete != null) {
                b.btnComplete.visibility = View.VISIBLE
                b.btnComplete.setOnClickListener { onComplete.invoke(appt) }
            } else {
                b.btnComplete.visibility = View.GONE
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemAppointmentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = holder.bind(getItem(position))

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<Appointment>() {
            override fun areItemsTheSame(a: Appointment, b: Appointment) =
                a.appointmentId == b.appointmentId
            override fun areContentsTheSame(a: Appointment, b: Appointment) = a == b
        }
    }
}
