package edu.cit.cabasag.barberconnect.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.cit.cabasag.barberconnect.databinding.ItemHaircutStyleBinding
import edu.cit.cabasag.barberconnect.model.HaircutStyle

class HaircutStyleAdapter(
    private val onSelect: (HaircutStyle) -> Unit
) : ListAdapter<HaircutStyle, HaircutStyleAdapter.ViewHolder>(DIFF) {

    private var selectedId: String? = null

    inner class ViewHolder(private val b: ItemHaircutStyleBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(style: HaircutStyle) {
            b.tvStyleName.text  = style.name ?: "Style"
            b.tvStylePrice.text = "₱${style.basePrice ?: 0}"
            b.tvStyleDuration.text = "${style.durationMinutes ?: 0} min"

            val isSelected = style.haircutStyleId == selectedId
            b.root.strokeWidth = if (isSelected) 3 else 0
            b.root.setCardBackgroundColor(
                b.root.context.getColor(
                    if (isSelected) edu.cit.cabasag.barberconnect.R.color.cream
                    else android.R.color.white
                )
            )

            b.root.setOnClickListener {
                selectedId = style.haircutStyleId
                notifyDataSetChanged()
                onSelect(style)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemHaircutStyleBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = holder.bind(getItem(position))

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<HaircutStyle>() {
            override fun areItemsTheSame(a: HaircutStyle, b: HaircutStyle) =
                a.haircutStyleId == b.haircutStyleId
            override fun areContentsTheSame(a: HaircutStyle, b: HaircutStyle) = a == b
        }
    }
}
