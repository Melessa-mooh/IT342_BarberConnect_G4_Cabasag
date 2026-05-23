package edu.cit.cabasag.barberconnect.ui

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import edu.cit.cabasag.barberconnect.databinding.ActivityLandingBinding

class LandingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLandingBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLandingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.cardCustomer.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
        }

        binding.cardBarber.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
        }
    }
}
