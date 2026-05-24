package edu.cit.cabasag.barberconnect.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.cit.cabasag.barberconnect.databinding.ItemIncomeRecordBinding
import edu.cit.cabasag.barberconnect.model.IncomeRecord
import java.text.SimpleDateFormat
import java.util.Locale

class IncomeRecordAdapter : ListAdapter<IncomeRecord, IncomeRecordAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val b: ItemIncomeRecordBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(record: IncomeRecord) {
            val rawDate = record.recordedAt.orEmpty()
            b.tvIncomeDate.text = try {
                val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                val d = sdf.parse(rawDate.take(19))
                if (d != null) SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(d) else rawDate
            } catch (_: Exception) {
                rawDate
            }

            b.tvIncomeCustomer.text = record.customerFullName ?: "Customer"
            b.tvIncomeService.text = record.serviceName ?: "Service"
            b.tvIncomePayment.text =
                "${record.paymentMethod ?: "Cash"} - Gross PHP ${"%.2f".format(record.amount ?: 0.0)}"
            b.tvIncomeFee.text = "Platform fee: PHP ${"%.2f".format(record.platformFee ?: 0.0)}"
            b.tvIncomeNet.text = "PHP ${"%.2f".format(record.netAmount ?: 0.0)}"
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemIncomeRecordBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = holder.bind(getItem(position))

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<IncomeRecord>() {
            override fun areItemsTheSame(a: IncomeRecord, b: IncomeRecord) =
                a.incomeRecordId == b.incomeRecordId

            override fun areContentsTheSame(a: IncomeRecord, b: IncomeRecord) = a == b
        }
    }
}
