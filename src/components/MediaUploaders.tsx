import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  PenTool,
  Image as ImageIcon,
  Camera,
  SwitchCamera,
  X,
  Check,
  AlertCircle,
  Loader2,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Move,
} from 'lucide-react';

const PASSPORT_OUTPUT_WIDTH = 700;
const PASSPORT_OUTPUT_HEIGHT = 900; // Exact 3.5 : 4.5 official ECI passport photo aspect ratio
const SIGNATURE_OUTPUT_WIDTH = 900;
const SIGNATURE_OUTPUT_HEIGHT = 270; // Wide 10 : 3 declaration signature strip aspect ratio

type CaptureVariant = 'passport' | 'signature';

interface CropTransform {
  zoom: number;
  offsetXFrac: number;
  offsetYFrac: number;
  rotationDeg: number;
}

const DEFAULT_CROP: CropTransform = {
  zoom: 1,
  offsetXFrac: 0,
  offsetYFrac: 0,
  rotationDeg: 0,
};

/**
 * Shared exact WYSIWYG crop renderer used for both the live interactive preview canvas
 * and the final high-resolution JPEG export so the saved PDF image matches the crop preview 1:1.
 */
function drawCroppedImageOnCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  crop: CropTransform
) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) return;

  const rotW = crop.rotationDeg % 180 === 0 ? srcW : srcH;
  const rotH = crop.rotationDeg % 180 === 0 ? srcH : srcW;
  const coverScale = Math.max(canvasW / rotW, canvasH / rotH);
  const drawScale = coverScale * crop.zoom;

  ctx.save();
  ctx.translate(
    canvasW / 2 + crop.offsetXFrac * canvasW,
    canvasH / 2 + crop.offsetYFrac * canvasH
  );
  ctx.rotate((crop.rotationDeg * Math.PI) / 180);
  ctx.scale(drawScale, drawScale);
  ctx.drawImage(img, -srcW / 2, -srcH / 2);
  ctx.restore();
}

function clampCropOffset(
  img: HTMLImageElement,
  frameW: number,
  frameH: number,
  zoom: number,
  rotationDeg: number,
  offsetXFrac: number,
  offsetYFrac: number,
  isSignature: boolean
): { offsetXFrac: number; offsetYFrac: number } {
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) return { offsetXFrac: 0, offsetYFrac: 0 };

  const rotW = rotationDeg % 180 === 0 ? srcW : srcH;
  const rotH = rotationDeg % 180 === 0 ? srcH : srcW;
  const coverScale = Math.max(frameW / rotW, frameH / rotH);
  const drawScale = coverScale * zoom;

  const halfOverflowX = Math.max(0, (rotW * drawScale - frameW) / 2) / frameW;
  const halfOverflowY = Math.max(0, (rotH * drawScale - frameH) / 2) / frameH;

  const maxX = isSignature ? Math.max(0.35, halfOverflowX) : halfOverflowX;
  const maxY = isSignature ? Math.max(0.35, halfOverflowY) : halfOverflowY;

  return {
    offsetXFrac: Math.min(maxX, Math.max(-maxX, offsetXFrac)),
    offsetYFrac: Math.min(maxY, Math.max(-maxY, offsetYFrac)),
  };
}

/**
 * Captures the FULL uncropped camera frame onto an off-screen canvas so the user
 * can freely drag, zoom, rotate, and crop the exact region they want.
 */
function captureRawVideoFrame(video: HTMLVideoElement, mirrorHorizontal: boolean): string {
  const w = video.videoWidth;
  const h = video.videoHeight;
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to initialize canvas for camera capture.');
  }

  ctx.save();
  if (mirrorHorizontal) {
    ctx.translate(outW, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, outW, outH);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.94);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unsupported image data format.'));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function exportCroppedJpeg(
  img: HTMLImageElement,
  variant: CaptureVariant,
  crop: CropTransform
): string {
  const outW = variant === 'signature' ? SIGNATURE_OUTPUT_WIDTH : PASSPORT_OUTPUT_WIDTH;
  const outH = variant === 'signature' ? SIGNATURE_OUTPUT_HEIGHT : PASSPORT_OUTPUT_HEIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to initialize canvas for cropped export.');
  }
  drawCroppedImageOnCanvas(ctx, img, outW, outH, crop);
  return canvas.toDataURL('image/jpeg', 0.9);
}

interface InteractiveCropperProps {
  sourceDataUrl: string;
  variant: CaptureVariant;
  crop: CropTransform;
  onCropChange: (next: CropTransform) => void;
  onImageLoaded: (img: HTMLImageElement | null) => void;
}

const InteractiveCropper: React.FC<InteractiveCropperProps> = ({
  sourceDataUrl,
  variant,
  crop,
  onCropChange,
  onImageLoaded,
}) => {
  const isSignature = variant === 'signature';
  const frameW = isSignature ? 340 : 252;
  const frameH = isSignature ? 102 : 324;
  const minZoom = isSignature ? 0.65 : 1;
  const maxZoom = isSignature ? 4 : 3.5;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const [imgReady, setImgReady] = useState(false);

  useEffect(() => {
    setImgReady(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      onImageLoaded(img);
      setImgReady(true);
    };
    img.onerror = () => {
      imgRef.current = null;
      onImageLoaded(null);
    };
    img.src = sourceDataUrl;
    return () => {
      onImageLoaded(null);
    };
  }, [sourceDataUrl, onImageLoaded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgReady) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(frameW * dpr);
    canvas.height = Math.round(frameH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawCroppedImageOnCanvas(ctx, img, frameW, frameH, crop);
  }, [crop, frameW, frameH, imgReady]);

  const applyUpdate = (patch: Partial<CropTransform>) => {
    const nextZoom = Math.min(maxZoom, Math.max(minZoom, patch.zoom ?? crop.zoom));
    const nextRotation = patch.rotationDeg ?? crop.rotationDeg;
    const rawX = patch.offsetXFrac ?? crop.offsetXFrac;
    const rawY = patch.offsetYFrac ?? crop.offsetYFrac;

    const clamped = imgRef.current
      ? clampCropOffset(
          imgRef.current,
          frameW,
          frameH,
          nextZoom,
          nextRotation,
          rawX,
          rawY,
          isSignature
        )
      : { offsetXFrac: rawX, offsetYFrac: rawY };

    onCropChange({
      zoom: nextZoom,
      rotationDeg: nextRotation,
      offsetXFrac: clamped.offsetXFrac,
      offsetYFrac: clamped.offsetYFrac,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: crop.offsetXFrac,
      startOffsetY: crop.offsetYFrac,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dxFrac = (e.clientX - drag.startX) / rect.width;
    const dyFrac = (e.clientY - drag.startY) / rect.height;
    applyUpdate({
      offsetXFrac: drag.startOffsetX + dxFrac,
      offsetYFrac: drag.startOffsetY + dyFrac,
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="flex w-full flex-col items-center gap-3.5">
      {/* Interactive Drag-to-Crop Frame */}
      <div
        className="relative overflow-hidden rounded border-2 border-white bg-white shadow-xl select-none"
        style={{
          width: `min(100%, ${frameW}px)`,
          aspectRatio: `${frameW} / ${frameH}`,
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="h-full w-full touch-none cursor-grab active:cursor-grabbing block"
          aria-label={isSignature ? 'Drag to crop signature' : 'Drag to crop passport photo'}
        />

        {/* Subtle Rule-of-Thirds & Alignment Grid Overlay (not saved into JPEG) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-1/3 border-t border-white/45" />
          <div className="absolute inset-x-0 top-2/3 border-t border-white/45" />
          <div className="absolute inset-y-0 left-1/3 border-l border-white/45" />
          <div className="absolute inset-y-0 left-2/3 border-l border-white/45" />
          {!isSignature ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-[66%] w-[62%] rounded-[999px] border border-dashed border-white/75" />
            </div>
          ) : null}
        </div>
      </div>

      {/* Helper caption */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
        <Move className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Drag image to reposition · Use Zoom &amp; Rotate to crop neatly</span>
      </div>

      {/* Zoom Slider + Rotate / Reset Controls */}
      <div className="w-full max-w-[360px] space-y-2.5 rounded-md border border-slate-800 bg-slate-900/90 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyUpdate({ zoom: Number((crop.zoom - 0.15).toFixed(2)) })}
            disabled={crop.zoom <= minZoom}
            aria-label="Zoom out"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
          >
            <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.05}
            value={crop.zoom}
            onChange={(e) => applyUpdate({ zoom: parseFloat(e.target.value) })}
            aria-label="Crop zoom level"
            className="h-1.5 flex-1 cursor-pointer accent-white"
          />

          <button
            type="button"
            onClick={() => applyUpdate({ zoom: Number((crop.zoom + 0.15).toFixed(2)) })}
            disabled={crop.zoom >= maxZoom}
            aria-label="Zoom in"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
          >
            <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <span className="min-w-[42px] text-right font-mono text-[11px] text-slate-300 tabular-nums">
            {Math.round(crop.zoom * 100)}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              applyUpdate({
                rotationDeg: (crop.rotationDeg + 90) % 360,
                offsetXFrac: 0,
                offsetYFrac: 0,
              })
            }
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 whitespace-nowrap"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Rotate 90°</span>
          </button>

          <button
            type="button"
            onClick={() => onCropChange({ ...DEFAULT_CROP })}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface CropImageModalProps {
  sourceDataUrl: string | null;
  variant: CaptureVariant;
  onClose: () => void;
  onApply: (croppedJpegDataUrl: string) => void;
}

const CropImageModal: React.FC<CropImageModalProps> = ({
  sourceDataUrl,
  variant,
  onClose,
  onApply,
}) => {
  const [crop, setCrop] = useState<CropTransform>(DEFAULT_CROP);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (sourceDataUrl) {
      setCrop({ ...DEFAULT_CROP });
    }
  }, [sourceDataUrl]);

  useEffect(() => {
    if (!sourceDataUrl) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sourceDataUrl, onClose]);

  const handleImageLoaded = useCallback((img: HTMLImageElement | null) => {
    loadedImgRef.current = img;
  }, []);

  if (!sourceDataUrl) return null;

  const isSignature = variant === 'signature';

  const handleApply = () => {
    if (!loadedImgRef.current) return;
    const cropped = exportCroppedJpeg(loadedImgRef.current, variant, crop);
    onApply(cropped);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <h3 id="crop-modal-title" className="text-sm font-semibold text-slate-900">
              {isSignature ? 'Crop Signature / Thumb Impression' : 'Crop Passport Photograph'}
            </h3>
            <p className="text-xs text-slate-500">
              {isSignature
                ? 'Drag, zoom & rotate to fit the Declaration signature box'
                : 'Drag, zoom & rotate to fit the 3.5 cm × 4.5 cm PDF photo box'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close crop editor"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-slate-950 p-4">
          <InteractiveCropper
            sourceDataUrl={sourceDataUrl}
            variant={variant}
            crop={crop}
            onCropChange={setCrop}
            onImageLoaded={handleImageLoaded}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#162d4b] whitespace-nowrap"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>{isSignature ? 'Crop & Use Signature' : 'Crop & Use Photo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface CameraCaptureModalProps {
  isOpen: boolean;
  variant?: CaptureVariant;
  onClose: () => void;
  onCapture: (jpegDataUrl: string) => void;
  onFallbackNativeCamera: () => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  variant = 'passport',
  onClose,
  onCapture,
  onFallbackNativeCamera,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const croppedImgRef = useRef<HTMLImageElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [status, setStatus] = useState<'starting' | 'ready' | 'error'>('starting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawCapturedUrl, setRawCapturedUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropTransform>(DEFAULT_CROP);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (preferredFacing: 'environment' | 'user') => {
      stopStream();
      setRawCapturedUrl(null);
      setCrop({ ...DEFAULT_CROP });
      setStatus('starting');
      setErrorMessage(null);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        setStatus('error');
        setErrorMessage(
          'Live browser camera is unavailable on this device or browser. Use Device Camera below to click a photo directly.'
        );
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: preferredFacing },
              width: { ideal: 1280 },
              height: { ideal: 1280 },
            },
            audio: false,
          });
        } catch {
          // Graceful fallback for desktop webcams without facingMode support
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('ready');
      } catch (err) {
        stopStream();
        setStatus('error');
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setErrorMessage(
            'Camera permission was denied. Allow camera access in browser settings or use Device Camera below.'
          );
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setErrorMessage(
            'No camera hardware was detected on this device. You can upload a photo from your device instead.'
          );
        } else {
          setErrorMessage(
            'Could not start live camera preview. Tap "Use Device Camera" below to capture directly.'
          );
        }
      }
    },
    [stopStream]
  );

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setRawCapturedUrl(null);
      return;
    }
    void startCamera(facingMode);
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleCropImageLoaded = useCallback((img: HTMLImageElement | null) => {
    croppedImgRef.current = img;
  }, []);

  if (!isOpen) return null;

  const isSignature = variant === 'signature';

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    try {
      const fullFrameUrl = captureRawVideoFrame(video, facingMode === 'user');
      setCrop({ ...DEFAULT_CROP });
      setRawCapturedUrl(fullFrameUrl);
      stopStream();
    } catch {
      setErrorMessage('Failed to capture photo frame. Please try again.');
    }
  };

  const handleConfirmCropped = () => {
    if (!croppedImgRef.current) return;
    try {
      const finalJpeg = exportCroppedJpeg(croppedImgRef.current, variant, crop);
      onCapture(finalJpeg);
      setRawCapturedUrl(null);
      onClose();
    } catch {
      setErrorMessage('Failed to crop captured image. Please try again.');
    }
  };

  const handleRetake = () => {
    setRawCapturedUrl(null);
    setCrop({ ...DEFAULT_CROP });
    void startCamera(facingMode);
  };

  const handleToggleFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="passport-camera-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <h3 id="passport-camera-title" className="text-sm font-semibold text-slate-900">
              {rawCapturedUrl
                ? isSignature
                  ? 'Crop Captured Signature'
                  : 'Crop Captured Photo'
                : isSignature
                ? 'Capture Signature / Thumb Impression'
                : 'Capture Passport Photograph'}
            </h3>
            <p className="text-xs text-slate-500">
              {rawCapturedUrl
                ? 'Drag, zoom, or rotate before saving to your PDF form'
                : isSignature
                ? 'Wide signature box · Crop available right after capture'
                : '3.5 cm × 4.5 cm · Crop available right after capture'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Camera Viewfinder OR Interactive Crop Workspace */}
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto bg-slate-950 p-4">
          {rawCapturedUrl ? (
            <InteractiveCropper
              sourceDataUrl={rawCapturedUrl}
              variant={variant}
              crop={crop}
              onCropChange={setCrop}
              onImageLoaded={handleCropImageLoaded}
            />
          ) : status === 'error' ? (
            <div className="flex max-w-xs flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-amber-400" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-slate-200">{errorMessage}</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFallbackNativeCamera();
                }}
                className="mt-1 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-[#1E3A5F] transition-colors hover:bg-slate-100 whitespace-nowrap"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                Use Device Camera
              </button>
            </div>
          ) : (
            <div
              className={`relative overflow-hidden rounded border border-slate-700 bg-black ${
                isSignature
                  ? 'aspect-[10/3] w-full max-w-[380px]'
                  : 'aspect-[7/9] w-full max-w-[280px]'
              }`}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`h-full w-full object-cover ${
                  facingMode === 'user' ? '-scale-x-100' : ''
                }`}
              />
              {status === 'starting' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 text-xs text-slate-200">
                  <Loader2 className="h-6 w-6 animate-spin text-white" aria-hidden="true" />
                  <span>Starting camera...</span>
                </div>
              ) : isSignature ? (
                /* Wide rectangular signature framing guide */
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-2.5"
                >
                  <div className="h-full w-full rounded border-2 border-dashed border-white/85" />
                  <span className="absolute bottom-2 rounded bg-slate-950/75 px-2 py-0.5 text-[11px] font-medium text-white">
                    Align signature on white paper inside box
                  </span>
                </div>
              ) : (
                /* Passport framing guide */
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                >
                  <div className="h-[68%] w-[64%] rounded-[999px] border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]" />
                  <span className="mt-3 rounded bg-slate-950/75 px-2 py-0.5 text-[11px] font-medium text-white">
                    Center face inside frame
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3">
          {rawCapturedUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmCropped}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#162d4b] whitespace-nowrap shrink-0"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>{isSignature ? 'Crop & Use Signature' : 'Crop & Use Photo'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={status !== 'ready'}
                onClick={handleToggleFacing}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
                title="Switch between rear and front camera"
              >
                <SwitchCamera className="h-4 w-4" aria-hidden="true" />
                <span>{facingMode === 'environment' ? 'Front Cam' : 'Rear Cam'}</span>
              </button>

              <button
                type="button"
                disabled={status !== 'ready'}
                onClick={handleSnap}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#162d4b] disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                <span>Take Photo &amp; Crop</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface PassportPhotoUploaderProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  required?: boolean;
}

/**
 * Mandatory Passport Size Photograph uploader (4.5 cm x 3.5 cm)
 * supporting live camera capture + interactive crop/zoom/rotate, native mobile camera fallback,
 * and manual gallery/file upload with instant cropping.
 */
export const PassportPhotoUploader: React.FC<PassportPhotoUploaderProps> = ({
  value,
  onChange,
  label = 'Passport Size Photograph (4.5 cm × 3.5 cm)',
  required = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 140;
    const h = 180; // Exact 3.5 : 4.5 passport aspect ratio
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    if (!value) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.setLineDash([]);
      ctx.fillStyle = '#64748b';
      ctx.font = '500 11px "Public Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('3.5 cm × 4.5 cm', w / 2, h / 2 - 4);
      ctx.font = '400 10px "Public Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('No photo selected', w / 2, h / 2 + 12);
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      const imgRatio = img.width / img.height;
      const boxRatio = w / h;
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;
      if (imgRatio > boxRatio) {
        sw = img.height * boxRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / boxRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    };
    img.src = value;
  }, [value]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Image must be smaller than 12 MB.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      // Open interactive cropper so user can adjust & crop the uploaded/native-camera photo
      setCropSourceUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read selected photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenCamera = () => {
    setError(null);
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      setIsCameraOpen(true);
    } else {
      nativeCameraInputRef.current?.click();
    }
  };

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">
          {label}
          {required ? <span className="ml-0.5 text-red-600">*</span> : null}
        </span>
        <span className="font-mono text-xs text-slate-500 tabular-nums">
          Live Camera · Crop · Gallery
        </span>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <canvas
          ref={canvasRef}
          className="h-[180px] w-[140px] shrink-0 rounded border border-slate-300 bg-white"
          aria-label="Passport photograph preview"
        />

        <div className="space-y-3">
          <p className="max-w-sm text-xs leading-relaxed text-slate-600">
            Capture a live photo using your camera or upload from gallery, then drag, zoom, and
            crop cleanly to exact 3.5 cm × 4.5 cm passport dimensions for the PDF slot.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleFile(e)}
              className="hidden"
            />
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => void handleFile(e)}
              className="hidden"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOpenCamera}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#162d4b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{value ? 'Retake Camera Photo' : 'Capture Photo'}</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{value ? 'Upload Different Photo' : 'Upload Photo'}</span>
            </button>

            {value ? (
              <>
                <button
                  type="button"
                  onClick={() => setCropSourceUrl(value)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#1E3A5F] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  <Crop className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Crop</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              </>
            ) : null}
          </div>

          {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
        </div>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        variant="passport"
        onClose={() => setIsCameraOpen(false)}
        onCapture={(jpegDataUrl) => {
          setError(null);
          onChange(jpegDataUrl);
        }}
        onFallbackNativeCamera={() => nativeCameraInputRef.current?.click()}
      />

      <CropImageModal
        sourceDataUrl={cropSourceUrl}
        variant="passport"
        onClose={() => setCropSourceUrl(null)}
        onApply={(croppedJpeg) => {
          setError(null);
          onChange(croppedJpeg);
        }}
      />
    </div>
  );
};

interface SignatureUploaderProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  required?: boolean;
}

/**
 * Signature / Thumb Impression uploader with live camera capture + interactive crop,
 * gallery upload + interactive crop, AND interactive draw pad.
 */
export const SignatureUploader: React.FC<SignatureUploaderProps> = ({
  value,
  onChange,
  label = 'Applicant Signature / Thumb Impression',
  required = true,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<'upload' | 'draw'>('upload');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'upload') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 280;
    const h = 84;
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (!value) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.setLineDash([]);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 11px "Public Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Signature / Thumb Impression Preview', w / 2, h / 2 + 4);
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      const pad = 8;
      const availW = w - pad * 2;
      const availH = h - pad * 2;
      const imgRatio = img.width / img.height;
      const availRatio = availW / availH;
      let dw = availW;
      let dh = availH;
      if (imgRatio > availRatio) {
        dh = availW / imgRatio;
      } else {
        dw = availH * imgRatio;
      }
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    img.src = value;
  }, [value, mode]);

  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    }
  }, [mode]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Image must be smaller than 12 MB.');
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropSourceUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read signature image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenCamera = () => {
    setError(null);
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      setIsCameraOpen(true);
    } else {
      nativeCameraInputRef.current?.click();
    }
  };

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPointerPos(e);
    ctx.strokeStyle = '#0f2557';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPointerPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = drawCanvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clearDrawPad = () => {
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    onChange(null);
  };

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">
          {label}
          {required ? <span className="ml-0.5 text-red-600">*</span> : null}
        </span>

        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'upload'
                ? 'bg-[#1E3A5F] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Camera / Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'draw'
                ? 'bg-[#1E3A5F] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="h-3.5 w-3.5" aria-hidden="true" />
            Draw Pad
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <canvas
            ref={previewCanvasRef}
            className="h-[84px] w-[280px] max-w-full shrink-0 rounded border border-slate-300 bg-white"
            aria-label="Signature preview"
          />
          <div className="space-y-2.5">
            <p className="text-xs text-slate-600">
              Capture a live photo of the applicant&apos;s signature or thumb impression on white
              paper, or upload an image — then drag, zoom, and crop cleanly for the PDF Declaration
              box.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void handleFile(e)}
                className="hidden"
              />
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => void handleFile(e)}
                className="hidden"
              />
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleOpenCamera}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#162d4b] disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{value ? 'Retake Camera Sign' : 'Capture Signature'}</span>
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{value ? 'Upload Different File' : 'Upload Signature'}</span>
              </button>
              {value ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCropSourceUrl(value)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#1E3A5F] hover:bg-slate-100 whitespace-nowrap shrink-0"
                  >
                    <Crop className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Crop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Clear</span>
                  </button>
                </>
              ) : null}
            </div>
            {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <canvas
            ref={drawCanvasRef}
            width={560}
            height={160}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="h-[110px] w-full max-w-[420px] touch-none cursor-crosshair rounded border border-slate-300 bg-white"
            aria-label="Interactive signature drawing pad"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearDrawPad}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear Signature Pad
            </button>
            <span className="text-xs text-slate-500">
              Sign with mouse, stylus, or finger — saved automatically.
            </span>
          </div>
        </div>
      )}

      <CameraCaptureModal
        isOpen={isCameraOpen}
        variant="signature"
        onClose={() => setIsCameraOpen(false)}
        onCapture={(jpegDataUrl) => {
          setError(null);
          onChange(jpegDataUrl);
        }}
        onFallbackNativeCamera={() => nativeCameraInputRef.current?.click()}
      />

      <CropImageModal
        sourceDataUrl={cropSourceUrl}
        variant="signature"
        onClose={() => setCropSourceUrl(null)}
        onApply={(croppedJpeg) => {
          setError(null);
          onChange(croppedJpeg);
        }}
      />
    </div>
  );
};
