import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, PenTool, Image as ImageIcon } from 'lucide-react';

interface PassportPhotoUploaderProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  required?: boolean;
}

/**
 * Mandatory Passport Size Photograph uploader (4.5 cm x 3.5 cm)
 * with immediate client-side HTML5 Canvas preview cropped cleanly to 3.5:4.5 ratio.
 */
export const PassportPhotoUploader: React.FC<PassportPhotoUploaderProps> = ({
  value,
  onChange,
  label = 'Passport Size Photograph (4.5 cm × 3.5 cm)',
  required = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      ctx.fillText('No photo uploaded', w / 2, h / 2 + 12);
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">
          {label}
          {required ? <span className="ml-0.5 text-red-600">*</span> : null}
        </span>
        <span className="font-mono text-xs text-slate-500 tabular-nums">JPG / PNG</span>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <canvas
          ref={canvasRef}
          className="h-[180px] w-[140px] shrink-0 rounded border border-slate-300 bg-white"
          aria-label="Passport photograph preview"
        />

        <div className="space-y-3">
          <p className="max-w-xs text-xs leading-relaxed text-slate-600">
            Recent unsigned colour passport photograph against a light background. Automatically normalized to JPEG and fitted into the official PDF photo frame.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#162d4b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {value ? 'Replace Photo' : 'Upload Photo'}
            </button>

            {value ? (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            ) : null}
          </div>
          {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
        </div>
      </div>
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
 * Signature / Thumb Impression uploader with client-side HTML5 Canvas preview
 * AND optional interactive draw pad for direct capture on tablets/phones/desktops.
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
  const [mode, setMode] = useState<'upload' | 'draw'>('upload');
  const [isDrawing, setIsDrawing] = useState(false);
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WebP).');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
            Upload Image
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
              Upload scanned signature or left thumb impression on white paper. Converted to JPEG and fitted cleanly into the Declaration box.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#162d4b] whitespace-nowrap shrink-0"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                {value ? 'Replace File' : 'Upload Signature'}
              </button>
              {value ? (
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear
                </button>
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
    </div>
  );
};
