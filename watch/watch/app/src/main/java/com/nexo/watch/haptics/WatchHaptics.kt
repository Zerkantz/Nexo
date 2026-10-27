package com.nexo.watch.haptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class WatchHaptics(context: Context) {
    private val vibrator = if (Build.VERSION.SDK_INT >= 31) context.getSystemService(VibratorManager::class.java).defaultVibrator
        else @Suppress("DEPRECATION") (context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator)
    fun play(type: String) {
        val pattern = when (type) {
            "SUCCESS" -> longArrayOf(0, 70)
            "FAIL" -> longArrayOf(0, 220, 120, 220)
            "ALERT_UP" -> longArrayOf(0, 90, 90, 90, 90, 90)
            "PING" -> longArrayOf(0, 60, 100, 60)
            else -> return
        }
        vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
    }
}
