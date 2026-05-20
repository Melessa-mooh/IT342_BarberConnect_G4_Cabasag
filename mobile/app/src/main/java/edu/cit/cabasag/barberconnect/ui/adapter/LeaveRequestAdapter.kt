package edu.cit.cabasag.barberconnect.ui.adapter

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.cit.cabasag.barberconnect.databinding.ItemLeaveRequestBinding
import edu.cit.cabasag.barberconnect.model.LeaveRequest

class LeaveRequestAdapter : ListAdapter<LeaveRequest, LeaveRequestAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val b: ItemLeaveRequestBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(lr: LeaveRequest) {
            b.tvLeaveDate.text   = "📅 ${lr.requestedDate ?: "—"}"
            b.tvLeaveReason.text = lr.reason ?: "No reason provided"

            val status = lr.status ?: "PENDING"
            b.tvLeaveStatus.text = status
            val (bg, fg) = when (status) {
                "APPROVED" -> "#D4EDDA" to "#155724"
                "DECLINED" -> "#F8D7DA" to "#721C24"
                else       -> "#FFF3CD" to "#856404"
            }
            b.tvLeaveStatus.setBackgroundColor(Color.parseColor(bg))
            b.tvLeaveStatus.setTextColor(Color.parseColor(fg))
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemLeaveRequestBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = holder.bind(getItem(position))

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<LeaveRequest>() {
            override fun areItemsTheSame(a: LeaveRequest, b: LeaveRequest) =
                a.leaveRequestId == b.leaveRequestId
            override fun areContentsTheSame(a: LeaveRequest, b: LeaveRequest) = a == b
        }
    }
}
