
// This is a simplified implementation to load and work with MNIST data in the browser

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

// Generate synthetic data for fallback when MNIST files can't be loaded
function generateSyntheticData(numImages: number, isTest: boolean = false): {
  images: number[][];
  labels: number[];
} {
  console.log(`Generating synthetic ${isTest ? 'test' : 'training'} data (${numImages} images)`);
  
  const images: number[][] = [];
  const labels: number[] = [];
  
  for (let i = 0; i < numImages; i++) {
    const digit = Math.floor(Math.random() * 10);
    const image = new Array(28 * 28).fill(0);
    
    // Create a simplified digit representation
    const centerX = 10 + Math.floor(Math.random() * 8);
    const centerY = 10 + Math.floor(Math.random() * 8);
    
    // Different patterns for different digits
    switch (digit) {
      case 0: // Draw a circle
        for (let angle = 0; angle < 360; angle += 15) {
          const radius = 6;
          const x = Math.floor(centerX + radius * Math.cos(angle * Math.PI / 180));
          const y = Math.floor(centerY + radius * Math.sin(angle * Math.PI / 180));
          if (x >= 0 && x < 28 && y >= 0 && y < 28) {
            image[y * 28 + x] = 0.8 + Math.random() * 0.2;
          }
        }
        break;
      case 1: // Draw a vertical line
        for (let y = centerY - 8; y <= centerY + 8; y++) {
          if (y >= 0 && y < 28) {
            image[y * 28 + centerX] = 0.8 + Math.random() * 0.2;
          }
        }
        break;
      default: // Draw a simple pattern for other digits
        for (let y = centerY - 4; y <= centerY + 4; y++) {
          for (let x = centerX - 4; x <= centerX + 4; x++) {
            if (x >= 0 && x < 28 && y >= 0 && y < 28) {
              // Create different patterns based on the digit
              if ((digit % 3 === 0 && (x + y) % 2 === 0) || 
                  (digit % 3 === 1 && Math.abs(x - centerX) + Math.abs(y - centerY) < 5) ||
                  (digit % 3 === 2 && (x * y) % 5 === 0)) {
                image[y * 28 + x] = 0.7 + Math.random() * 0.3;
              }
            }
          }
        }
        break;
    }
    
    // Add some noise to make it look more like handwriting
    for (let i = 0; i < 28 * 28; i++) {
      if (image[i] > 0) {
        // Add noise to pixels that are already drawn
        const neighbors = [
          i - 29, i - 28, i - 27,
          i - 1,          i + 1,
          i + 27, i + 28, i + 29
        ];
        
        neighbors.forEach(n => {
          if (n >= 0 && n < 28 * 28 && Math.random() < 0.6) {
            image[n] = Math.max(image[n], (0.3 + Math.random() * 0.5) * image[i]);
          }
        });
      }
    }
    
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
    
    // Determine the correct base path for data files
    const baseUrl = window.location.origin + import.meta.env.BASE_URL;
    const possiblePaths = [
      new URL('data/', new URL(import.meta.env.BASE_URL, window.location.origin)).href,
      new URL('data/', baseUrl).href,
      baseUrl + 'data/',
      window.location.origin + '/data/',
      import.meta.env.BASE_URL + 'data/'
    ];
    
    console.log("Trying to load MNIST data from possible paths:", possiblePaths);
    
    let trainImagesResponse, trainLabelsResponse, testImagesResponse, testLabelsResponse;
    let successPath = '';
    
    // Try each possible path until one works
    for (const path of possiblePaths) {
      try {
        trainImagesResponse = await fetch(`${path}train-images.idx3-ubyte`);
        if (trainImagesResponse.ok) {
          successPath = path;
          console.log(`Successfully found MNIST data at: ${path}`);
          break;
        }
      } catch (error) {
        console.log(`Failed to load from ${path}:`, error);
      }
    }
    
    if (successPath) {
      // If we found a working path, load all files from there
      trainLabelsResponse = await fetch(`${successPath}train-labels.idx1-ubyte`);
      testImagesResponse = await fetch(`${successPath}t10k-images.idx3-ubyte`);
      testLabelsResponse = await fetch(`${successPath}t10k-labels.idx1-ubyte`);
      
      if (!trainImagesResponse.ok || !trainLabelsResponse.ok || 
          !testImagesResponse.ok || !testLabelsResponse.ok) {
        throw new Error('Failed to load all MNIST data files');
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
      throw new Error('Failed to load training data');
    }
  } catch (error) {
    console.error('Error loading MNIST data:', error);
    
    // Generate synthetic data as fallback
    const trainCount = 3000; // 5% of 60,000
    const testCount = 1000;  // 10% of 10,000
    
    const trainData = generateSyntheticData(trainCount, false);
    const testData = generateSyntheticData(testCount, true);
    
    return {
      trainImages: trainData.images,
      trainLabels: trainData.labels,
      testImages: testData.images,
      testLabels: testData.labels
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
