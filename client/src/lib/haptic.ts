/**
 * Haptic feedback utilities
 * Wraps navigator.vibrate with safe fallback for unsupported browsers.
 */

/** Light tap — for card presses, toggles, chip selections (8ms) */
export function hapticLight() {
  try { navigator.vibrate?.(8); } catch { /* unsupported */ }
}

/** Medium tap — for confirmations, successful actions (20ms) */
export function hapticMedium() {
  try { navigator.vibrate?.(20); } catch { /* unsupported */ }
}

/** Heavy tap — for scan success, destructive actions (60ms) */
export function hapticHeavy() {
  try { navigator.vibrate?.(60); } catch { /* unsupported */ }
}
