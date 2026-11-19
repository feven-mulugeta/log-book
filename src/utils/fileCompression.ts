export interface ProcessedAttachmentResult {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  originalBytes: number;
  finalBytes: number;
  dataUrlLength: number;
  wasCompressed: boolean;
  savedPercent: number;
  width?: number;
  height?: number;
}

export function formatFileWeight(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function estimateDataUrlBytes(dataUrl: string): number {
  if (!dataUrl) return 0;
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx < 0) return dataUrl.length;
  const header = dataUrl.slice(0, commaIdx);
  const body = dataUrl.slice(commaIdx + 1);
  if (header.includes(';base64')) {
    const padding = body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((body.length * 3) / 4) - padding);
  }
  return body.length;
}

export function compressImageDataUrl(
  rawDataUrl: string,
  targetMaxDataUrlChars = 480000
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const renderScaled = (maxDim: number, quality: number) => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return { dataUrl: rawDataUrl, width, height };
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        return {
          dataUrl: canvas.toDataURL('image/jpeg', quality),
          width,
          height,
        };
      };

      const attempts: [number, number][] = [
        [1600, 0.85],
        [1400, 0.78],
        [1200, 0.72],
        [1000, 0.64],
        [850, 0.56],
      ];

      let best = renderScaled(attempts[0][0], attempts[0][1]);
      if (rawDataUrl.length <= targetMaxDataUrlChars && rawDataUrl.length < best.dataUrl.length) {
        resolve({
          dataUrl: rawDataUrl,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
        return;
      }

      if (best.dataUrl.length <= targetMaxDataUrlChars) {
        resolve(best);
        return;
      }

      for (let i = 1; i < attempts.length; i++) {
        const candidate = renderScaled(attempts[i][0], attempts[i][1]);
        best = candidate;
        if (candidate.dataUrl.length <= targetMaxDataUrlChars) {
          resolve(candidate);
          return;
        }
      }

      resolve(renderScaled(720, 0.5));
    };
    img.onerror = () => reject(new Error('Unable to read image for compression.'));
    img.src = rawDataUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

export async function processAttachmentFile(
  file: File,
  options?: {
    maxRawMb?: number;
    targetMaxChars?: number;
    hardMaxChars?: number;
  }
): Promise<ProcessedAttachmentResult> {
  const maxRawMb = options?.maxRawMb ?? 15;
  const targetMaxChars = options?.targetMaxChars ?? 480000;
  const hardMaxChars = options?.hardMaxChars ?? 720000;
  const originalBytes = file.size;

  if (originalBytes > maxRawMb * 1024 * 1024) {
    throw new Error(
      `Detected file weight is ${formatFileWeight(originalBytes)}, which exceeds the ${maxRawMb} MB upload limit.`
    );
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const lowerType = (file.type || '').toLowerCase();
  const isRasterImage =
    lowerType.startsWith('image/') && !lowerType.includes('svg');

  let finalDataUrl = rawDataUrl;
  let width: number | undefined;
  let height: number | undefined;

  // Detect any raster photo/scan > 100 KB (or >140K base64 chars) and auto-compress
  if (isRasterImage && (originalBytes > 100 * 1024 || rawDataUrl.length > 140000)) {
    const compressed = await compressImageDataUrl(rawDataUrl, targetMaxChars);
    if (compressed.dataUrl.length < rawDataUrl.length || rawDataUrl.length > hardMaxChars) {
      finalDataUrl = compressed.dataUrl;
    }
    width = compressed.width;
    height = compressed.height;
  }

  if (finalDataUrl.length > hardMaxChars) {
    throw new Error(
      `Detected file weight is ${formatFileWeight(originalBytes)}. Non-image files (PDF/SVG) cannot exceed ~500 KB for cloud sync. Please upload a photo or screenshot (JPG/PNG) so the app can auto-compress it.`
    );
  }

  const finalBytes = estimateDataUrlBytes(finalDataUrl);
  const wasCompressed = finalDataUrl !== rawDataUrl && finalBytes < originalBytes;
  const savedPercent =
    wasCompressed && originalBytes > 0
      ? Math.max(1, Math.round(((originalBytes - finalBytes) / originalBytes) * 100))
      : 0;

  return {
    dataUrl: finalDataUrl,
    fileName: file.name,
    mimeType: file.type,
    originalBytes,
    finalBytes,
    dataUrlLength: finalDataUrl.length,
    wasCompressed,
    savedPercent,
    width,
    height,
  };
}
