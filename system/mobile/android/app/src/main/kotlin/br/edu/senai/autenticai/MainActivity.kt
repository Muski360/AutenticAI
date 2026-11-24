package br.edu.senai.autenticai

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.ByteArrayOutputStream

class MainActivity : FlutterActivity() {
    private var channel: MethodChannel? = null
    private var picker: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        channel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "autenticai/android")
        channel?.setMethodCallHandler { call, result ->
            try {
                when (call.method) {
                    "overlayStatus" -> result.success(mapOf(
                        "allowed" to Settings.canDrawOverlays(this),
                        "active" to OverlayService.active,
                    ))
                    "overlaySettings" -> {
                        startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
                        result.success(null)
                    }
                    "startOverlay" -> {
                        check(Settings.canDrawOverlays(this))
                        startForegroundService(Intent(this, OverlayService::class.java))
                        result.success(null)
                    }
                    "stopOverlay" -> {
                        stopService(Intent(this, CaptureService::class.java))
                        stopService(Intent(this, OverlayService::class.java))
                        CaptureState.pending = null
                        result.success(null)
                    }
                    "takeCapture" -> {
                        val capture = CaptureState.pending
                        CaptureState.pending = null
                        result.success(capture)
                    }
                    "pickImage" -> {
                        if (picker != null) {
                            result.error("picker", "Já existe um seletor de imagem aberto.", null)
                        } else {
                            startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                                addCategory(Intent.CATEGORY_OPENABLE)
                                type = "image/*"
                                putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/png", "image/jpeg", "image/webp"))
                            }, PICK_IMAGE)
                            picker = result
                        }
                    }
                    else -> result.notImplemented()
                }
            } catch (_: Exception) {
                result.error("android", "Não foi possível concluir a ação no Android.", null)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (CaptureState.pending != null) channel?.invokeMethod("captureReady", null)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (CaptureState.pending != null) channel?.invokeMethod("captureReady", null)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != PICK_IMAGE) return
        val callback = picker ?: return
        picker = null
        val uri = data?.data
        if (resultCode != Activity.RESULT_OK || uri == null) {
            callback.success(null)
            return
        }
        Thread {
            try {
                val bytes = checkNotNull(contentResolver.openInputStream(uri)).use { source ->
                    val output = ByteArrayOutputStream()
                    val buffer = ByteArray(8192)
                    while (true) {
                        val read = source.read(buffer)
                        if (read < 0) break
                        if (output.size() + read > MAX_IMAGE_BYTES) throw ImageTooLarge()
                        output.write(buffer, 0, read)
                    }
                    output.toByteArray()
                }
                runOnUiThread { callback.success(bytes) }
            } catch (_: ImageTooLarge) {
                runOnUiThread { callback.error("image_size", "O print deve ter até 5 MiB.", null) }
            } catch (_: Exception) {
                runOnUiThread { callback.error("image", "Não foi possível abrir o print selecionado.", null) }
            }
        }.start()
    }

    private class ImageTooLarge : Exception()
    companion object { private const val PICK_IMAGE = 80 }
}
