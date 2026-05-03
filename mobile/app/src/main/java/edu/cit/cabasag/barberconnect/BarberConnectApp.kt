package edu.cit.cabasag.barberconnect

import android.app.Application
import edu.cit.cabasag.barberconnect.network.RetrofitClient

class BarberConnectApp : Application() {
    
    lateinit var retrofitClient: RetrofitClient
        private set

    override fun onCreate() {
        super.onCreate()
        retrofitClient = RetrofitClient(this)
    }
}
