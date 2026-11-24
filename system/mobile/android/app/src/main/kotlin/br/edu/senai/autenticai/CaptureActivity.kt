package br.edu.senai.autenticai

import android.app.Activity
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Bundle

class CaptureActivity : Activity() {
    private var handedOff = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (savedInstanceState != null) return
        try {
            startActivityForResult(getSystemService(MediaProjectionManager::class.java).createScreenCaptureIntent(), CONSENT)
        } catch (_: Exception) {
            CaptureState.finish(this, mapOf("error" to "O Android não conseguiu abrir a autorização de captura."))
            finishAndRemoveTask()
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != CONSENT) return
        if (resultCode != RESULT_OK || data == null) {
            CaptureState.finish(this, mapOf("error" to "A captura não foi autorizada."))
        } else if (OverlayService.active && CaptureState.inProgress) {
            try {
                startForegroundService(Intent(this, CaptureService::class.java).putExtra("consent", data))
                handedOff = true
            } catch (_: Exception) {
                CaptureState.finish(this, mapOf("error" to "Não foi possível iniciar a captura no Android."))
            }
        }
        finishAndRemoveTask()
    }

    override fun onDestroy() {
        if (isFinishing && !handedOff && CaptureState.inProgress) {
            CaptureState.inProgress = false
            OverlayService.restoreButton()
        }
        super.onDestroy()
    }

    companion object { private const val CONSENT = 81 }
}
