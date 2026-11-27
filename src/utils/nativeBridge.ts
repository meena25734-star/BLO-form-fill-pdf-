import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Returns true only when running inside the compiled native Android/iOS Capacitor APK.
 * Returns false on the regular web browser and installed Chrome PWA.
 */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}

function utf8StringToBase64(text: string): string {
  const encoded = new TextEncoder().encode(text);
  return uint8ArrayToBase64(encoded);
}

/**
 * Saves a binary (PDF) or text (CSV) file natively on Android and opens the Android
 * Share / Save / Print sheet so users can view, print, or WhatsApp it directly offline.
 * Returns true if handled natively, or false when running on Web.
 */
export async function exportFileNatively(
  payload: Uint8Array | string,
  fileName: string,
  dialogTitle = 'Save, Print, or Share Document'
): Promise<boolean> {
  if (!isNativeApp()) {
    return false;
  }

  const base64Data =
    typeof payload === 'string' ? utf8StringToBase64(payload) : uint8ArrayToBase64(payload);

  // 1. Write to app cache for reliable FileProvider sharing across all Android 10-15 devices
  await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Cache,
    recursive: true,
  });

  // 2. Also save a persistent local copy in Documents/BLO_Form_PDF when permitted
  try {
    await Filesystem.writeFile({
      path: `BLO_Form_PDF/${fileName}`,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });
  } catch {
    // Non-fatal if scoped storage restricts Documents on some devices
  }

  // 3. Open native Android Share / Open PDF / Print sheet
  const { uri } = await Filesystem.getUri({
    path: fileName,
    directory: Directory.Cache,
  });

  await Share.share({
    title: fileName,
    text: fileName,
    url: uri,
    dialogTitle,
  });

  return true;
}

/**
 * Connects the Android hardware Back button to in-app navigation so pressing Back inside a
 * form returns smoothly to the Home screen instead of closing the app immediately.
 */
export function registerNativeBackHandler(handleBack: () => boolean): () => void {
  if (!isNativeApp()) {
    return () => {};
  }

  let removeListener: (() => Promise<void>) | null = null;
  let disposed = false;

  void CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    const handledByApp = handleBack();
    if (handledByApp) {
      return;
    }
    if (canGoBack) {
      window.history.back();
    } else {
      void CapacitorApp.exitApp();
    }
  }).then((listener) => {
    if (disposed) {
      void listener.remove();
    } else {
      removeListener = () => listener.remove();
    }
  });

  return () => {
    disposed = true;
    if (removeListener) {
      void removeListener();
    }
  };
}
