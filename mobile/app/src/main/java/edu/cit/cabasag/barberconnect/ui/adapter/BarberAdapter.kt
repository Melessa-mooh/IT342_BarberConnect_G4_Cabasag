package edu.cit.cabasag.barberconnect.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.cit.cabasag.barberconnect.databinding.ItemBarberBinding
import edu.cit.cabasag.barberconnect.model.Barber

class BarberAdapter(
    private val onBook: (Barber) -> Unit
) : ListAdapter<Barber, BarberAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val b: ItemBarberBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(barber: Barber) {
            val name = barber.displayName().ifBlank { "Barber" }
            b.tvBarberName.text   = name
            b.tvBarberBio.text    = barber.bio ?: "No bio available"
            b.tvBarberRating.text = "⭐ ${barber.rating ?: "0.0"} (${barber.totalReviews ?: 0})"
            b.tvBarberExp.text    = "${barber.yearsExperience ?: 0} yrs exp"
            b.tvBarberAvatar.text = name.firstOrNull()?.uppercaseChar()?.toString() ?: "B"
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
