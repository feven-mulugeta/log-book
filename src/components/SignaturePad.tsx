import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  preceptorName?: string;
}

export function SignaturePad({ onSave, onCancel, preceptorName }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(preceptorName || '');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#1e3a8a'; // Deep medical navy
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    } else {
      // Generate SVG data url for typed signature
      const safeName = typedName.trim() || 'Clinical Preceptor';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="90" viewBox="0 0 300 90"><path d="M 15 50 Q 60 20, 110 55 T 190 35 T 270 50" fill="none" stroke="#1e3a8a" stroke-width="2.5"/><text x="30" y="65" font-family="Brush Script MT, cursive, Georgia" font-size="24" fill="#1e3a8a">${safeName}</text></svg>`;
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-slate-700" />
          <span className="text-sm font-semibold text-slate-900">Preceptor Digital Signature</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              mode === 'draw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Draw Sign
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              mode === 'type' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Type Sign
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/70 p-1 overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              className="w-full h-36 bg-white rounded-lg cursor-crosshair block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                Draw official signature here with touch or stylus
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Legally binding clinical preceptor endorsement</span>
            <button
              type="button"
              onClick={clearCanvas}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-rose-600 py-1 px-2 rounded-md hover:bg-slate-100 transition-colors"
            >
              <Eraser className="w-3.5 h-3.5" />
              Clear signature
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Signatory Full Name
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="e.g. Sister Almaz Tesfaye, RN, MSc"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            />
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <p className="text-xs text-slate-500 mb-2">Signature Preview:</p>
            <div className="font-serif italic text-2xl text-blue-900 tracking-wide py-2">
              {typedName || 'Sister Almaz Tesfaye'}
            </div>
            <div className="w-48 h-0.5 bg-blue-900/30 mx-auto mt-1" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={mode === 'draw' && !hasDrawn}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
        >
          <Check className="w-4 h-4" />
          Adopt Signature
        </button>
      </div>
    </div>
  );
}
