// This is a simplified implementation to load and work with MNIST data in the browser
import { generateSyntheticDigit } from './mnist-data';

// Function to parse IDX file format with subset loading
function parseIDXFile(buffer: Uint8Array, subsampleRatio: number = 1): number[][] | number[] {
  const header = new DataView(buffer.buffer);
  
  // Check magic number (first two bytes should be 0)
  const magicNumber = header.getInt32(0, false); // Read as big-endian 32-bit int
  
  // The third byte is the data type (0x08 for unsigned byte)
  // The fourth byte is the number of dimensions
  const numDimensions = magicNumber & 0xFF; // Get last byte
  
  if (numDimensions !== 1 && numDimensions !== 3) {
    throw new Error(`Unsupported number of dimensions: ${numDimensions}`);
  }
  
  const dimensions: number[] = [];
  for (let i = 0; i < numDimensions; i++) {
    dimensions.push(header.getUint32(4 + i * 4, false)); // big-endian
  }
  
  const dataOffset = 4 + numDimensions * 4;
  
  if (numDimensions === 1) {
    // Labels file
    const totalLabels = dimensions[0];
    const subsetSize = Math.floor(totalLabels * subsampleRatio);
    const stride = Math.floor(1 / subsampleRatio);
    
    const labels = new Array(subsetSize);
    for (let i = 0; i < subsetSize; i++) {
      labels[i] = buffer[dataOffset + i * stride];
    }
    return labels;
  } else {
    // Images file
    const totalImages = dimensions[0];
    const height = dimensions[1];
    const width = dimensions[2];
    const imageSize = width * height;
    const subsetSize = Math.floor(totalImages * subsampleRatio);
    const stride = Math.floor(1 / subsampleRatio);
    
    const images: number[][] = new Array(subsetSize);
    for (let i = 0; i < subsetSize; i++) {
      const image = new Array(imageSize);
      const baseOffset = dataOffset + (i * stride) * imageSize;
      for (let j = 0; j < imageSize; j++) {
        image[j] = buffer[baseOffset + j] / 255.0;
      }
      images[i] = image;
    }
    return images;
  }
}

// Generate fallback synthetic data when real MNIST files can't be loaded
function generateSyntheticData(numImages: number, isTest: boolean = false): {
  images: number[][];
  labels: number[];
} {
  console.warn(`Using synthetic ${isTest ? 'test' : 'training'} data as fallback for ${numImages} images`);
  
  const images: number[][] = [];
  const labels: number[] = [];
  
  for (let i = 0; i < numImages; i++) {
    // Generate digit from 0-9
    const digit = Math.floor(Math.random() * 10);
    const image = generateSyntheticDigit(digit);
    
    images.push(image);
    labels.push(digit);
  }
  
  return { images, labels };
}

// Load MNIST data from the original IDX files
export async function loadMnistData(): Promise<{
  trainImages: number[][];
  trainLabels: number[];
  testImages: number[][];
  testLabels: number[];
}> {
  try {
    console.log("Loading MNIST data...");
    
    // Define subsample ratios directly (5% for training, 10% for testing)
    const trainSubsampleRatio = 0.05;
    const testSubsampleRatio = 0.10;
    
    // Define possible paths to check for MNIST data
    const basePaths = [
      // Root-relative paths
      '/data/',
      // Origin-relative paths
      `${window.location.origin}/data/`,
      // Current path-relative paths
      './data/',
      // Base URL paths
      `${import.meta.env.BASE_URL}data/`,
      `${new URL('data/', window.location.href).href}`,
    ];
    
    console.log("Trying to load MNIST data from possible paths:", basePaths);
    
    let trainImagesResponse, trainLabelsResponse, testImagesResponse, testLabelsResponse;
    let successPath = '';
    
    // Try each possible path until one works
    for (const path of basePaths) {
      try {
        const url = `${path}train-images.idx3-ubyte`;
        console.log(`[MNIST] Attempting to fetch: ${url}`);
        
        trainImagesResponse = await fetch(url, { 
          cache: 'no-cache',
          headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        });
        
        console.log(`[MNIST] Fetched ${url} - status: ${trainImagesResponse.status}`);
        
        if (trainImagesResponse.ok) {
          successPath = path;
          console.log(`[MNIST] Successfully found MNIST data at: ${path}`);
          break;
        } else {
          console.warn(`[MNIST] Fetch failed for ${url} with status: ${trainImagesResponse.status}`);
        }
      } catch (error) {
        console.warn(`[MNIST] Error fetching from ${path}:`, error);
      }
    }
    
    if (successPath) {
      // If we found a working path, load all files from there
      const labelUrl = `${successPath}train-labels.idx1-ubyte`;
      const testImgUrl = `${successPath}t10k-images.idx3-ubyte`;
      const testLblUrl = `${successPath}t10k-labels.idx1-ubyte`;
      
      console.log(`[MNIST] Fetching all files from: ${successPath}`);
      
      // Fetch all files with no caching
      const fetchOptions = { 
        cache: 'no-cache', 
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' } 
      };
      
      trainLabelsResponse = await fetch(labelUrl, fetchOptions);
      testImagesResponse = await fetch(testImgUrl, fetchOptions);
      testLabelsResponse = await fetch(testLblUrl, fetchOptions);
      
      console.log(`[MNIST] train-labels.idx1-ubyte status: ${trainLabelsResponse.status}`);
      console.log(`[MNIST] t10k-images.idx3-ubyte status: ${testImagesResponse.status}`);
      console.log(`[MNIST] t10k-labels.idx1-ubyte status: ${testLabelsResponse.status}`);
      
      if (!trainImagesResponse.ok || !trainLabelsResponse.ok || 
          !testImagesResponse.ok || !testLabelsResponse.ok) {
        throw new Error('[MNIST] Failed to load all MNIST data files');
      }

      const [trainImagesBuffer, trainLabelsBuffer, testImagesBuffer, testLabelsBuffer] = await Promise.all([
        trainImagesResponse.arrayBuffer(),
        trainLabelsResponse.arrayBuffer(),
        testImagesResponse.arrayBuffer(),
        testLabelsResponse.arrayBuffer()
      ]);

      // Parse data with subsampling
      const trainImages = parseIDXFile(new Uint8Array(trainImagesBuffer), trainSubsampleRatio) as number[][];
      const trainLabels = parseIDXFile(new Uint8Array(trainLabelsBuffer), trainSubsampleRatio) as number[];
      const testImages = parseIDXFile(new Uint8Array(testImagesBuffer), testSubsampleRatio) as number[][];
      const testLabels = parseIDXFile(new Uint8Array(testLabelsBuffer), testSubsampleRatio) as number[];

      console.log(`Loaded ${trainImages.length} training images and ${testImages.length} test images`);
      
      return {
        trainImages,
        trainLabels,
        testImages,
        testLabels
      };
    } else {
      console.warn('Could not load MNIST data from any path, using synthetic data');
      
      // Generate synthetic data as fallback
      const { images: trainImages, labels: trainLabels } = generateSyntheticData(3000);
      const { images: testImages, labels: testLabels } = generateSyntheticData(1000, true);
      
      console.log(`Generated ${trainImages.length} synthetic training images and ${testImages.length} synthetic test images`);
      
      // Instead of throwing, return the synthetic data
      return {
        trainImages,
        trainLabels,
        testImages,
        testLabels
      };
    }
  } catch (error) {
    console.error('Error loading MNIST data:', error);
    
    // Generate synthetic data as fallback even if there's an error
    const { images: trainImages, labels: trainLabels } = generateSyntheticData(3000);
    const { images: testImages, labels: testLabels } = generateSyntheticData(1000, true);
    
    console.log(`Generated ${trainImages.length} synthetic training images and ${testImages.length} synthetic test images as fallback`);
    
    return {
      trainImages,
      trainLabels,
      testImages,
      testLabels
    };
  }
}

// Utility to convert an MNIST image (flat array) to a 2D matrix
export const imageToMatrix = (image: number[]): number[][] => {
  const matrix: number[][] = [];
  const size = Math.sqrt(image.length);
  
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      row.push(image[i * size + j]);
    }
    matrix.push(row);
  }
  
  return matrix;
};

// Utility to visualize a digit on a canvas element
export function renderDigitToCanvas(canvas: HTMLCanvasElement, image: number[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Create a temporary canvas for the original 28x28 image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 28;
  tempCanvas.height = 28;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // Create ImageData for the 28x28 image
  const imageData = tempCtx.createImageData(28, 28);
  const data = imageData.data;

  // Fill the image data
  for (let i = 0; i < image.length; i++) {
    const value = image[i];  // Value between 0 and 1
    const invertedValue = Math.floor((1 - value) * 255);  // Invert and scale to 0-255
    const idx = i * 4;
    data[idx] = invertedValue;     // R
    data[idx + 1] = invertedValue; // G
    data[idx + 2] = invertedValue; // B
    data[idx + 3] = 255;          // A
  }

  // Put the image data on the temporary canvas
  tempCtx.putImageData(imageData, 0, 0);

  // Disable image smoothing for crisp pixels
  ctx.imageSmoothingEnabled = false;

  // Calculate the scaling to fit the digit in the canvas while maintaining aspect ratio
  const padding = 20; // Add some padding around the digit
  const scale = Math.min(
    (canvas.width - padding * 2) / 28,
    (canvas.height - padding * 2) / 28
  );

  // Calculate centered position
  const scaledWidth = 28 * scale;
  const scaledHeight = 28 * scale;
  const x = (canvas.width - scaledWidth) / 2;
  const y = (canvas.height - scaledHeight) / 2;

  // Draw the scaled image centered on the main canvas
  ctx.drawImage(
    tempCanvas,
    0, 0, 28, 28,  // Source rectangle
    x, y, scaledWidth, scaledHeight  // Destination rectangle
  );
}
