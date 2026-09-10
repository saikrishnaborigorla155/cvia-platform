// CVIA — Cryptographic & Perceptual File Analysis Engine
// Offline, in-browser Web Crypto API & Canvas analysis

export interface FileAnalysisResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  sha256: string;
  sha256Short: string;
  lastModified: number;
  previewUrl?: string;
  imageMeta?: {
    width: number;
    height: number;
    brightness: number;
    perceptualHash: string;
  };
  textContent?: string;
  jsonParsed?: any;
}

/**
 * Calculates SHA-256 hash of a file or ArrayBuffer using browser Web Crypto API
 */
export async function computeSHA256(data: ArrayBuffer | Blob): Promise<string> {
  const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes perceptual hash (dHash - Difference Hash) and brightness from an image File/Blob
 */
export async function computeImagePerceptualHash(file: File): Promise<{
  perceptualHash: string;
  brightness: number;
  width: number;
  height: number;
  previewUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      const previewUrl = reader.result as string;
      img.onerror = () => {
        resolve({
          perceptualHash: 'pHash:0000000000000000',
          brightness: 128,
          width: 0,
          height: 0,
          previewUrl,
        });
      };
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // Render to 9x8 offscreen canvas for dHash (difference hash)
        const canvas = document.createElement('canvas');
        canvas.width = 9;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            perceptualHash: 'pHash:ffffffffffffffff',
            brightness: 128,
            width,
            height,
            previewUrl,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, 9, 8);
        const imgData = ctx.getImageData(0, 0, 9, 8);
        const pixels = imgData.data;

        // Compute greyscale values
        const greys: number[][] = [];
        let totalBrightness = 0;
        let count = 0;

        for (let y = 0; y < 8; y++) {
          const row: number[] = [];
          for (let x = 0; x < 9; x++) {
            const idx = (y * 9 + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const grey = 0.299 * r + 0.587 * g + 0.114 * b;
            row.push(grey);
            totalBrightness += grey;
            count++;
          }
          greys.push(row);
        }

        // Generate 64-bit difference hash
        let hashBits = '';
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const bit = greys[y][x] > greys[y][x + 1] ? '1' : '0';
            hashBits += bit;
          }
        }

        // Convert 64 bits to 16-hex characters
        let hexHash = '';
        for (let i = 0; i < hashBits.length; i += 4) {
          const nibble = hashBits.substring(i, i + 4);
          hexHash += parseInt(nibble, 2).toString(16);
        }

        resolve({
          perceptualHash: `pHash:${hexHash}`,
          brightness: Math.round(totalBrightness / (count || 1)),
          width,
          height,
          previewUrl,
        });
      };
      img.src = previewUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fully analyzes any input file from the user's file manager
 */
export async function analyzeInputFile(file: File): Promise<FileAnalysisResult> {
  const buffer = await file.arrayBuffer();
  const sha256 = await computeSHA256(buffer);
  const sha256Short = `sha256:${sha256.substring(0, 16)}...${sha256.substring(sha256.length - 8)}`;

  let imageMeta: FileAnalysisResult['imageMeta'] = undefined;
  let previewUrl: string | undefined = undefined;
  let textContent: string | undefined = undefined;
  let jsonParsed: any = undefined;

  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(file.name);
  const isJson = file.type === 'application/json' || file.name.endsWith('.json');
  const isText = file.type.startsWith('text/') || /\.(txt|csv|yaml|yml|log|md)$/i.test(file.name);

  if (isImage) {
    try {
      const pHashResult = await computeImagePerceptualHash(file);
      imageMeta = {
        width: pHashResult.width,
        height: pHashResult.height,
        brightness: pHashResult.brightness,
        perceptualHash: pHashResult.perceptualHash,
      };
      previewUrl = pHashResult.previewUrl;
    } catch (e) {
      console.warn('Perceptual hash computation failed:', e);
    }
  } else if (isJson && file.size < 5 * 1024 * 1024) {
    try {
      const text = new TextDecoder().decode(buffer);
      textContent = text.length > 2000 ? text.substring(0, 2000) + '... (truncated)' : text;
      jsonParsed = JSON.parse(text);
    } catch {
      // ignore invalid json
    }
  } else if (isText && file.size < 2 * 1024 * 1024) {
    try {
      const text = new TextDecoder().decode(buffer);
      textContent = text.length > 2000 ? text.substring(0, 2000) + '... (truncated)' : text;
    } catch {
      // ignore decode error
    }
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || getExtensionMime(file.name),
    sha256: `sha256:${sha256}`,
    sha256Short,
    lastModified: file.lastModified,
    previewUrl,
    imageMeta,
    textContent,
    jsonParsed,
  };
}

/**
 * Computes Hamming distance between two hex perceptual hashes
 */
export function computeHammingDistance(pHashA: string, pHashB: string): number {
  const cleanA = pHashA.replace(/^pHash:/i, '');
  const cleanB = pHashB.replace(/^pHash:/i, '');
  if (cleanA.length !== cleanB.length) return 64;

  let distance = 0;
  for (let i = 0; i < cleanA.length; i++) {
    const binA = parseInt(cleanA[i], 16).toString(2).padStart(4, '0');
    const binB = parseInt(cleanB[i], 16).toString(2).padStart(4, '0');
    for (let j = 0; j < 4; j++) {
      if (binA[j] !== binB[j]) distance++;
    }
  }
  return distance;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0) return '0 B';
  if (i >= sizes.length) return `${(bytes / Math.pow(k, sizes.length - 1)).toFixed(2)} ${sizes[sizes.length - 1]}`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getExtensionMime(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'onnx': return 'application/octet-stream (ONNX Model)';
    case 'pt':
    case 'pth': return 'application/octet-stream (PyTorch Weights)';
    case 'bin': return 'application/octet-stream (Binary Model Checkpoint)';
    case 'safetensors': return 'application/octet-stream (SafeTensors)';
    case 'tflite': return 'application/octet-stream (TFLite Model)';
    case 'json': return 'application/json';
    case 'csv': return 'text/csv';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}
