package edu.cit.cabasag.barberconnect.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import edu.cit.cabasag.barberconnect.R
import edu.cit.cabasag.barberconnect.databinding.ItemHaircutStyleBinding
import edu.cit.cabasag.barberconnect.model.HaircutStyle
import edu.cit.cabasag.barberconnect.util.HaircutImageFallback

class HaircutStyleAdapter(
    private val showManageActions: Boolean = false,
    private val onEdit: (HaircutStyle) -> Unit = {},
    private val onDelete: (HaircutStyle) -> Unit = {},
    private val onSelect: (HaircutStyle) -> Unit
) : ListAdapter<HaircutStyle, HaircutStyleAdapter.ViewHolder>(DIFF) {

    private var selectedId: String? = null

    inner class ViewHolder(private val b: ItemHaircutStyleBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(style: HaircutStyle) {
            b.tvStyleName.text = style.name ?: "Style"
            b.tvStyleDescription.text = style.description.orEmpty().ifBlank { "Haircut service" }
            b.tvStylePrice.text = "PHP ${"%.2f".format(style.basePrice ?: 0.0)}"
            b.tvStyleDuration.text = "${style.durationMinutes ?: 0} min"
            b.tvStyleStatus.text = if (style.isActive == false) "Inactive" else "Active"

            val fallback = HaircutImageFallback.defaultDrawable(style.name)
            val remoteUrl = HaircutImageFallback.usableRemoteUrl(style)
            if (remoteUrl == null) {
                Glide.with(b.ivStyleImage).clear(b.ivStyleImage)
                b.ivStyleImage.setImageResource(fallback)
            } else {
                Glide.with(b.ivStyleImage)
                    .load(remoteUrl)
                    .placeholder(fallback)
                    .error(fallback)
                    .centerCrop()
                    .into(b.ivStyleImage)
            }

            val isSelected = style.haircutStyleId == selectedId
            b.root.strokeWidth = if (isSelected) 3 else 0
            b.root.setCardBackgroundColor(
                b.root.context.getColor(
                    if (isSelected) R.color.orange_soft else android.R.color.white
                )
            )
            b.styleActions.visibility = if (showManageActions) View.VISIBLE else View.GONE
            b.btnEditStyle.setOnClickListener { onEdit(style) }
            b.btnDeleteStyle.setOnClickListener { onDelete(style) }

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
