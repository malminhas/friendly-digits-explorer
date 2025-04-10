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
    
    // Load training data with subsampling
    const [trainImagesResponse, trainLabelsResponse] = await Promise.all([
      fetch('/data/train-images.idx3-ubyte'),
      fetch('/data/train-labels.idx1-ubyte')
    ]);

    if (!trainImagesResponse.ok || !trainLabelsResponse.ok) {
      throw new Error('Failed to load training data');
    }

    const [trainImagesBuffer, trainLabelsBuffer] = await Promise.all([
      trainImagesResponse.arrayBuffer(),
      trainLabelsResponse.arrayBuffer()
    ]);

    // Parse training data with subsampling
    const trainImages = parseIDXFile(new Uint8Array(trainImagesBuffer), trainSubsampleRatio) as number[][];
    const trainLabels = parseIDXFile(new Uint8Array(trainLabelsBuffer), trainSubsampleRatio) as number[];

    // Load test data with subsampling
    const [testImagesResponse, testLabelsResponse] = await Promise.all([
      fetch('/data/t10k-images.idx3-ubyte'),
      fetch('/data/t10k-labels.idx1-ubyte')
    ]);

    if (!testImagesResponse.ok || !testLabelsResponse.ok) {
      throw new Error('Failed to load test data');
    }

    const [testImagesBuffer, testLabelsBuffer] = await Promise.all([
      testImagesResponse.arrayBuffer(),
      testLabelsResponse.arrayBuffer()
    ]);

    // Parse test data with subsampling
    const testImages = parseIDXFile(new Uint8Array(testImagesBuffer), testSubsampleRatio) as number[][];
    const testLabels = parseIDXFile(new Uint8Array(testLabelsBuffer), testSubsampleRatio) as number[];

    console.log(`Loaded ${trainImages.length} training images and ${testImages.length} test images`);
    
    return {
      trainImages,
      trainLabels,
      testImages,
      testLabels
    };
  } catch (error) {
    console.error('Error loading MNIST data:', error);
    throw error;
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
