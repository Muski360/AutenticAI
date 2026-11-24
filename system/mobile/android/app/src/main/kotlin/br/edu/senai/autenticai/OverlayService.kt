package br.edu.senai.autenticai

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button

class OverlayService : Service() {
    private var button: Button? = null
    private val windows by lazy { getSystemService(WindowManager::class.java) }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "stop" || !Settings.canDrawOverlays(this)) {
            stopService(Intent(this, CaptureService::class.java))
            CaptureState.pending = null
            stopSelf()
            return START_NOT_STICKY
        }
        if (button != null) return START_NOT_STICKY
        try {
            val notification = captureNotification(this, "Botão flutuante ativado", OverlayService::class.java, 41)
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(41, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
            } else startForeground(41, notification)
            val trigger = Button(this).apply {
                val density = resources.displayMetrics.density
                text = "Capturar"
                isAllCaps = false
                setTextColor(Color.WHITE)
                minHeight = (48 * density).toInt()
                background = GradientDrawable().apply {
                    cornerRadius = 6 * density
                    setColor(0xFF102E44.toInt())
                    setStroke((1 * density).toInt(), 0xFF2DBBEF.toInt())
                }
                contentDescription = "Capturar tela com AutenticAI"
                setOnClickListener {
                    if (CaptureState.inProgress) return@setOnClickListener
                    CaptureState.pending = null
                    CaptureState.inProgress = true
                    try {
                        startActivity(Intent(this@OverlayService, CaptureActivity::class.java)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                        visibility = View.INVISIBLE
                    } catch (_: Exception) {
                        CaptureState.inProgress = false
                        visibility = View.VISIBLE
                        android.widget.Toast.makeText(this@OverlayService, "Não foi possível abrir a autorização de captura.", android.widget.Toast.LENGTH_LONG).show()
                    }
                }
            }
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT,
            ).apply { gravity = Gravity.END or Gravity.CENTER_VERTICAL }
            windows.addView(trigger, params)
            button = trigger
            instance = this
        } catch (_: Exception) {
            android.widget.Toast.makeText(this, "Não foi possível ativar o botão flutuante.", android.widget.Toast.LENGTH_LONG).show()
            stopSelf()
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        button?.let { windows.removeView(it) }
        button = null
        instance = null
        CaptureState.inProgress = false
        super.onDestroy()
    }

    companion object {
        private var instance: OverlayService? = null
        val active: Boolean get() = instance != null
        fun restoreButton() { instance?.button?.visibility = View.VISIBLE }
    }
}

internal fun captureNotification(service: Service, description: String, target: Class<*>, id: Int): Notification {
    val manager = service.getSystemService(NotificationManager::class.java)
    val channel = "autenticai_status"
    manager.createNotificationChannel(NotificationChannel(channel, "Captura do AutenticAI", NotificationManager.IMPORTANCE_LOW))
    val open = PendingIntent.getActivity(service, id, Intent(service, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
    val stop = PendingIntent.getService(service, id, Intent(service, target).setAction("stop"), PendingIntent.FLAG_IMMUTABLE)
    return Notification.Builder(service, channel)
        .setSmallIcon(android.R.drawable.ic_menu_camera)
        .setContentTitle("AutenticAI")
        .setContentText(description)
        .setContentIntent(open)
        .addAction(Notification.Action.Builder(null, "Parar", stop).build())
        .setOngoing(true)
        .build()
}
