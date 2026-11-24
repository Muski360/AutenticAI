package br.edu.senai.autenticai

import android.app.Activity
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.graphics.Point
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.WindowManager
import android.widget.Toast
import java.io.ByteArrayOutputStream
import kotlin.math.roundToInt

internal const val MAX_IMAGE_BYTES = 5 * 1024 * 1024

internal object CaptureState {
    var pending: Map<String, Any>? = null
    var inProgress = false
    private var generation = 0

    fun finish(context: Context, data: Map<String, Any>) {
        inProgress = false
        OverlayService.restoreButton()
        pending = data
        val current = ++generation
        Handler(Looper.getMainLooper()).postDelayed({
            if (generation == current) pending = null
        }, 60_000)
        try {
            context.startActivity(Intent(context, MainActivity::class.java).addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP,
            ))
        } catch (_: Exception) {
            Toast.makeText(context, "Abra o AutenticAI para ver a prévia da captura.", Toast.LENGTH_LONG).show()
        }
    }
}

class CaptureService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private var projection: MediaProjection? = null
    private var display: VirtualDisplay? = null
    private var reader: ImageReader? = null
    private var ended = false
    private val density by lazy { resources.displayMetrics.densityDpi }
    private val callback = object : MediaProjection.Callback() {
        override fun onStop() {
            fail("A captura foi interrompida pelo Android.")
        }

        override fun onCapturedContentResize(width: Int, height: Int) {
            val virtualDisplay = display ?: return
            if (ended || width <= 0 || height <= 0) return
            val size = scaledSize(width, height)
            if (reader?.width == size.x && reader?.height == size.y) return
            try {
                val previous = reader
                val next = openReader(size)
                try {
                    virtualDisplay.resize(size.x, size.y, density)
                    virtualDisplay.surface = next.surface
                } finally { previous?.close() }
            } catch (_: Exception) {
                fail("Não foi possível ajustar o tamanho da captura.")
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "stop") {
            fail("A captura foi cancelada.")
            return START_NOT_STICKY
        }
        if (projection != null) return START_NOT_STICKY
        if (!OverlayService.active || !CaptureState.inProgress) {
            stopSelf()
            return START_NOT_STICKY
        }
        @Suppress("DEPRECATION")
        val consent = if (Build.VERSION.SDK_INT >= 33) intent?.getParcelableExtra("consent", Intent::class.java)
            else intent?.getParcelableExtra<Intent>("consent")
        try {
            val notification = captureNotification(this, "Capturando uma imagem da tela", CaptureService::class.java, 42)
            if (Build.VERSION.SDK_INT >= 29) {
                startForeground(42, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
            } else startForeground(42, notification)
            val session = checkNotNull(getSystemService(MediaProjectionManager::class.java)
                .getMediaProjection(Activity.RESULT_OK, checkNotNull(consent)))
            projection = session
            session.registerCallback(callback, handler)
            // Aguarda o Android fechar o consentimento antes de abrir a superfície.
            handler.postDelayed({ startDisplay(session) }, 500)
            handler.postDelayed({ fail("O Android não retornou uma imagem legível. A tela pode estar protegida.") }, 5500)
        } catch (_: Exception) {
            fail("Não foi possível capturar a tela com a autorização recebida.")
        }
        return START_NOT_STICKY
    }

    @Suppress("DEPRECATION")
    private fun startDisplay(session: MediaProjection) {
        if (ended) return
        try {
            val wm = getSystemService(WindowManager::class.java)
            val size = if (Build.VERSION.SDK_INT >= 30) wm.maximumWindowMetrics.bounds.let {
                scaledSize(it.width(), it.height())
            } else Point().apply { wm.defaultDisplay.getRealSize(this) }.let { scaledSize(it.x, it.y) }
            val surface = openReader(size).surface
            display = checkNotNull(session.createVirtualDisplay("AutenticAI", size.x, size.y,
                density, DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, surface, null, handler))
        } catch (_: Exception) {
            fail("Não foi possível abrir a imagem da tela.")
        }
    }

    private fun scaledSize(width: Int, height: Int): Point {
        val scale = minOf(1.0, 2048.0 / maxOf(width, height))
        return Point((width * scale).roundToInt().coerceAtLeast(1), (height * scale).roundToInt().coerceAtLeast(1))
    }

    private fun openReader(size: Point): ImageReader =
        ImageReader.newInstance(size.x, size.y, PixelFormat.RGBA_8888, 2).also {
            reader = it
            it.setOnImageAvailableListener(::readFrame, handler)
        }

    private fun readFrame(source: ImageReader) {
        if (ended || reader !== source) return
        try {
            val bytes = source.acquireLatestImage()?.use { frame ->
                val plane = frame.planes[0]
                val padded = Bitmap.createBitmap(plane.rowStride / plane.pixelStride, frame.height, Bitmap.Config.ARGB_8888)
                try {
                    padded.copyPixelsFromBuffer(plane.buffer)
                    val bitmap = Bitmap.createBitmap(padded, 0, 0, frame.width, frame.height)
                    try {
                        // Algumas superfícies protegidas chegam como um quadro preto.
                        if ((1..19).all { x -> (2..18).all { y ->
                            val color = bitmap.getPixel(x * (bitmap.width - 1) / 20, y * (bitmap.height - 1) / 20)
                            color and 0x00ffffff == 0
                        } }) return@use null
                        ByteArrayOutputStream().use { output ->
                            check(bitmap.compress(Bitmap.CompressFormat.JPEG, 85, output))
                            check(output.size() <= MAX_IMAGE_BYTES)
                            output.toByteArray()
                        }
                    } finally { if (bitmap !== padded) bitmap.recycle() }
                } finally { padded.recycle() }
            } ?: return
            complete(mapOf("image" to bytes))
        } catch (_: Exception) {
            fail("Não foi possível ler a imagem capturada.")
        }
    }

    private fun fail(message: String) {
        complete(mapOf("error" to message))
    }

    private fun complete(data: Map<String, Any>) {
        if (ended) return
        ended = true
        releaseProjection()
        CaptureState.finish(this, data)
        stopSelf()
    }

    private fun releaseProjection() {
        handler.removeCallbacksAndMessages(null)
        display?.release()
        display = null
        reader?.close()
        reader = null
        projection?.let {
            it.unregisterCallback(callback)
            it.stop()
        }
        projection = null
    }

    override fun onDestroy() {
        val interrupted = !ended
        ended = true
        releaseProjection()
        if (interrupted) {
            CaptureState.inProgress = false
            OverlayService.restoreButton()
        }
        super.onDestroy()
    }
}
