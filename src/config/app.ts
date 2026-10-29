/** App-wide settings that aren't user preferences. */

/**
 * Where "Quick exit" sends the browser. Pick something ordinary that loads fast.
 * The app uses `location.replace` and `no-referrer`, so this site never learns where the
 * visitor came from.
 */
export const QUICK_EXIT_URL = 'https://www.google.com/'

/** Re-lock (when a PIN is set) after the app has been in the background this long. */
export const AUTO_LOCK_MINUTES = 5

/** Photos are resized so their longest side is at most this many pixels. */
export const PHOTO_MAX_DIMENSION = 1024
export const PHOTO_QUALITY = 0.72
/** localStorage holds roughly 5 MB per site; this keeps photos well under that. */
export const MAX_PHOTOS = 6
