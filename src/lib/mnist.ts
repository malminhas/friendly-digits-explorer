// This is a simplified implementation to load and work with MNIST data in the browser

// Function to parse IDX file format
function parseIDXFile(buffer: Uint8Array): number[][] | number[] {
  const header = new DataView(buffer.buffer);
  
  // Log header information
  console.log("File header:", {
    byte0: header.getUint8(0),
    byte1: header.getUint8(1),
    byte2: header.getUint8(2),
    byte3: header.getUint8(3)
  });
  
  // Check magic number (first two bytes should be 0)
  const magicNumber = header.getInt32(0, false); // Read as big-endian 32-bit int
  console.log("Magic number:", magicNumber);
  
  // The third byte is the data type (0x08 for unsigned byte)
  // The fourth byte is the number of dimensions
  const numDimensions = magicNumber & 0xFF; // Get last byte
  console.log("Number of dimensions:", numDimensions);
  
  if (numDimensions !== 1 && numDimensions !== 3) {
    throw new Error(`Unsupported number of dimensions: ${numDimensions}`);
  }
  
  const dimensions: number[] = [];
  for (let i = 0; i < numDimensions; i++) {
    dimensions.push(header.getUint32(4 + i * 4, false)); // big-endian
  }
  
  console.log("File dimensions:", dimensions);
  
  const dataOffset = 4 + numDimensions * 4;
  console.log("Data offset:", dataOffset);
  
  if (numDimensions === 1) {
    // Labels file (60000 labels for training, 10000 for testing)
    const labels = new Array(dimensions[0]);
    for (let i = 0; i < dimensions[0]; i++) {
      labels[i] = buffer[dataOffset + i];
    }
    return labels;
  } else {
    // Images file (60000x28x28 for training, 10000x28x28 for testing)
    const numImages = dimensions[0];
    const height = dimensions[1];
    const width = dimensions[2];
    const imageSize = width * height;
    
    const images: number[][] = new Array(numImages);
    for (let i = 0; i < numImages; i++) {
      const image = new Array(imageSize);
      for (let j = 0; j < imageSize; j++) {
        image[j] = buffer[dataOffset + i * imageSize + j] / 255.0;
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
    
    // Load training data
    const trainImagesResponse = await fetch('/data/train-images.idx3-ubyte');
    const trainLabelsResponse = await fetch('/data/train-labels.idx1-ubyte');
    const testImagesResponse = await fetch('/data/t10k-images.idx3-ubyte');
    const testLabelsResponse = await fetch('/data/t10k-labels.idx1-ubyte');

    if (!trainImagesResponse.ok || !trainLabelsResponse.ok || 
        !testImagesResponse.ok || !testLabelsResponse.ok) {
      throw new Error('Failed to load MNIST data');
    }

    const trainImagesBuffer = await trainImagesResponse.arrayBuffer();
    const trainLabelsBuffer = await trainLabelsResponse.arrayBuffer();
    const testImagesBuffer = await testImagesResponse.arrayBuffer();
    const testLabelsBuffer = await testLabelsResponse.arrayBuffer();

    console.log("Parsing data...");

    // Parse training data
    const trainImages = parseIDXFile(new Uint8Array(trainImagesBuffer)) as number[][];
    const trainLabels = parseIDXFile(new Uint8Array(trainLabelsBuffer)) as number[];
    const testImages = parseIDXFile(new Uint8Array(testImagesBuffer)) as number[][];
    const testLabels = parseIDXFile(new Uint8Array(testLabelsBuffer)) as number[];

    console.log("Preprocessing data...");

    // Use only 5% of training data and 10% of test data for faster training
    const trainSize = Math.floor(trainImages.length * 0.05);
    const testSize = Math.floor(testImages.length * 0.1);

    // Create shuffled indices for both training and test sets
    const trainIndices = Array.from({ length: trainImages.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, trainSize);
    
    const testIndices = Array.from({ length: testImages.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, testSize);

    // Select reduced datasets
    const reducedTrainImages = trainIndices.map(i => trainImages[i]);
    const reducedTrainLabels = trainIndices.map(i => trainLabels[i]);
    const reducedTestImages = testIndices.map(i => testImages[i]);
    const reducedTestLabels = testIndices.map(i => testLabels[i]);

    console.log(`Using ${reducedTrainImages.length} training images and ${reducedTestImages.length} test images`);
    
    return {
      trainImages: reducedTrainImages,
      trainLabels: reducedTrainLabels,
      testImages: reducedTestImages,
      testLabels: reducedTestLabels
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
