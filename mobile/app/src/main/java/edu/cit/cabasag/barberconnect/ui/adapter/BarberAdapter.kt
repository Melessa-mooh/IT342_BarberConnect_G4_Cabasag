package edu.cit.cabasag.barberconnect.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import edu.cit.cabasag.barberconnect.databinding.ItemBarberBinding
import edu.cit.cabasag.barberconnect.model.Barber

class BarberAdapter(
    private val onBook: (Barber) -> Unit
) : ListAdapter<Barber, BarberAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val b: ItemBarberBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(barber: Barber) {
            val name = barber.displayName().ifBlank { "Barber" }
            b.tvBarberName.text = name
            b.tvBarberBio.text = barber.bio ?: "No bio available"
            b.tvBarberRating.text = "Rating ${barber.rating ?: "0.0"} (${barber.totalReviews ?: 0})"
            b.tvBarberExp.text = "${barber.yearsExperience ?: 0} yrs exp"
            b.tvBarberAvailability.text = if (barber.isAvailable == false) "Offline" else "Available"
            b.tvBarberAvatar.text = name.firstOrNull()?.uppercaseChar()?.toString() ?: "B"

            if (!barber.profileImageUrl.isNullOrBlank()) {
                b.ivBarberAvatar.visibility = View.VISIBLE
                b.tvBarberAvatar.visibility = View.GONE
                Glide.with(b.ivBarberAvatar)
                    .load(barber.profileImageUrl)
                    .centerCrop()
                    .into(b.ivBarberAvatar)
            } else {
                Glide.with(b.ivBarberAvatar).clear(b.ivBarberAvatar)
                b.ivBarberAvatar.setImageDrawable(null)
                b.ivBarberAvatar.visibility = View.GONE
                b.tvBarberAvatar.visibility = View.VISIBLE
            }

            b.btnBook.setOnClickListener { onBook(barber) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemBarberBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = holder.bind(getItem(position))

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<Barber>() {
            override fun areItemsTheSame(a: Barber, b: Barber) = a.id == b.id
            override fun areContentsTheSame(a: Barber, b: Barber) = a == b
        }
    }
}
