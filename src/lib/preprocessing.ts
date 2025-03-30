// Preprocessing functions for digit normalization

// Find the bounding box of the digit
function findBoundingBox(imageData: number[]): { top: number; bottom: number; left: number; right: number } {
  const size = Math.sqrt(imageData.length);
  let top = size;
  let bottom = 0;
  let left = size;
  let right = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      if (imageData[idx] > 0.1) { // threshold for considering a pixel as part of the digit
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }

  // Handle empty image
  if (top > bottom || left > right) {
    return { top: 0, bottom: size - 1, left: 0, right: size - 1 };
  }

  return { top, bottom, left, right };
}

// Center the digit in the image
function centerDigit(imageData: number[]): number[] {
  const size = Math.sqrt(imageData.length);
  const { top, bottom, left, right } = findBoundingBox(imageData);

  // Calculate digit dimensions
  const digitHeight = bottom - top + 1;
  const digitWidth = right - left + 1;

  // Calculate target position (center of image)
  const targetTop = Math.floor((size - digitHeight) / 2);
  const targetLeft = Math.floor((size - digitWidth) / 2);

  // Create new centered image
  const centered = new Array(imageData.length).fill(0);

  // Copy digit to centered position
  for (let y = 0; y < digitHeight; y++) {
    for (let x = 0; x < digitWidth; x++) {
      const srcIdx = (top + y) * size + (left + x);
      const dstIdx = (targetTop + y) * size + (targetLeft + x);
      centered[dstIdx] = imageData[srcIdx];
    }
  }

  return centered;
}

// Scale the digit to fill most of the image while maintaining aspect ratio
function scaleDigit(imageData: number[]): number[] {
  const size = Math.sqrt(imageData.length);
  const { top, bottom, left, right } = findBoundingBox(imageData);

  // Calculate current dimensions
  const currentHeight = bottom - top + 1;
  const currentWidth = right - left + 1;

  // Target size (80% of image size)
  const targetSize = Math.floor(size * 0.8);

  // Calculate scale factor while maintaining aspect ratio
  const scale = Math.min(
    targetSize / currentHeight,
    targetSize / currentWidth
  );

  // Create scaled image
  const scaled = new Array(imageData.length).fill(0);

  // Scale digit
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Map to original coordinates
      const srcX = left + (x - left) / scale;
      const srcY = top + (y - top) / scale;

      // Bilinear interpolation
      const x1 = Math.floor(srcX);
      const y1 = Math.floor(srcY);
      const x2 = Math.min(x1 + 1, size - 1);
      const y2 = Math.min(y1 + 1, size - 1);

      const fx = srcX - x1;
      const fy = srcY - y1;

      const v1 = imageData[y1 * size + x1] || 0;
      const v2 = imageData[y1 * size + x2] || 0;
      const v3 = imageData[y2 * size + x1] || 0;
      const v4 = imageData[y2 * size + x2] || 0;

      scaled[y * size + x] =
        v1 * (1 - fx) * (1 - fy) +
        v2 * fx * (1 - fy) +
        v3 * (1 - fx) * fy +
        v4 * fx * fy;
    }
  }

  return scaled;
}

// Normalize pixel values to [0,1] range
function normalizePixels(imageData: number[]): number[] {
  const max = Math.max(...imageData);
  if (max === 0) return imageData;
  return imageData.map(x => x / max);
}

// Apply Gaussian blur to smooth the image
function gaussianBlur(imageData: number[]): number[] {
  const size = Math.sqrt(imageData.length);
  const blurred = new Array(imageData.length).fill(0);
  
  // Gaussian kernel (7x7) with stronger center weight
  const kernel = [
    [1, 2, 4, 5, 4, 2, 1],
    [2, 4, 8, 10, 8, 4, 2],
    [4, 8, 16, 20, 16, 8, 4],
    [5, 10, 20, 25, 20, 10, 5],
    [4, 8, 16, 20, 16, 8, 4],
    [2, 4, 8, 10, 8, 4, 2],
    [1, 2, 4, 5, 4, 2, 1]
  ];
  const kernelSum = kernel.flat().reduce((a, b) => a + b, 0);

  // Apply convolution
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      
      // Apply kernel
      for (let ky = -3; ky <= 3; ky++) {
        for (let kx = -3; kx <= 3; kx++) {
          const px = Math.min(Math.max(x + kx, 0), size - 1);
          const py = Math.min(Math.max(y + ky, 0), size - 1);
          sum += imageData[py * size + px] * kernel[ky + 3][kx + 3];
        }
      }
      
      blurred[y * size + x] = sum / kernelSum;
    }
  }

  return blurred;
}

// Main preprocessing function that combines all steps
export function preprocessDigit(imageData: number[]): number[] {
  console.log('Preprocessing input image:', {
    size: Math.sqrt(imageData.length),
    nonZeroPixels: imageData.filter(x => x > 0).length,
    min: Math.min(...imageData),
    max: Math.max(...imageData)
  });

  let processed = [...imageData];
  
  // Apply initial strong blur to thicken lines
  processed = gaussianBlur(processed);
  processed = gaussianBlur(processed); // Apply twice for stronger effect
  
  // Center the digit
  processed = centerDigit(processed);
  console.log('After centering:', {
    nonZeroPixels: processed.filter(x => x > 0).length,
    min: Math.min(...processed),
    max: Math.max(...processed)
  });
  
  // Scale the digit
  processed = scaleDigit(processed);
  console.log('After scaling:', {
    nonZeroPixels: processed.filter(x => x > 0).length,
    min: Math.min(...processed),
    max: Math.max(...processed)
  });
  
  // Final blur to smooth any artifacts
  processed = gaussianBlur(processed);
  
  // Enhance contrast before normalization
  const threshold = 0.2;
  processed = processed.map(x => x > threshold ? Math.min(x * 1.2, 1) : x * 0.8);
  
  // Final normalization
  processed = normalizePixels(processed);
  console.log('After normalization:', {
    nonZeroPixels: processed.filter(x => x > 0).length,
    min: Math.min(...processed),
    max: Math.max(...processed)
  });
  
  return processed;
} 