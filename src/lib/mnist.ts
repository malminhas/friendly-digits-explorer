// This is a simplified implementation to load and work with MNIST data in the browser

// Load MNIST data from a reliable source
export const loadMnistData = async () => {
  try {
    // Fetch pre-processed MNIST data
    const [imagesResponse, labelsResponse] = await Promise.all([
      fetch('https://storage.googleapis.com/tfjs-tutorials/mnist_images.png'),
      fetch('https://storage.googleapis.com/tfjs-tutorials/mnist_labels_uint8')
    ]);
    
    if (!imagesResponse.ok || !labelsResponse.ok) {
      throw new Error('Failed to fetch MNIST data');
    }
    
    // Process the image data (contains all digit images)
    const dataBlob = await imagesResponse.blob();
    const dataImg = await createImageBitmap(dataBlob);
    
    // Process the label data
    const labelsArrayBuffer = await labelsResponse.arrayBuffer();
    const labelsArray = new Uint8Array(labelsArrayBuffer);
    
    // Extract pixels from the image
    const canvas = document.createElement('canvas');
    canvas.width = dataImg.width;
    canvas.height = dataImg.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    ctx.drawImage(dataImg, 0, 0);
    
    // MNIST standard dimensions
    const numTrainImages = 60000;
    const numTestImages = 10000;
    const digitWidth = 28;
    const digitHeight = 28;
    const trainImages: number[][] = [];
    const trainLabels: number[] = [];
    const testImages: number[][] = [];
    const testLabels: number[] = [];
    
    // Helper to extract a digit image from the sprite sheet
    const extractDigit = (index: number): [number[], number] => {
      const digitsPerRow = Math.floor(dataImg.width / digitWidth);
      
      const x = (index % digitsPerRow) * digitWidth;
      const y = Math.floor(index / digitsPerRow) * digitHeight;
      
      const digitData = ctx.getImageData(x, y, digitWidth, digitHeight);
      
      // Convert pixel data to a normalized array (0-1 values)
      const pixelArray: number[] = [];
      for (let i = 0; i < digitData.data.length; i += 4) {
        // Get grayscale value and normalize to 0-1
        pixelArray.push(digitData.data[i] / 255);
      }
      
      // Get the correct label from the labels array
      const label = labelsArray[index];
      
      return [pixelArray, label];
    };
    
    // Generate training data (first 60k images)
    for (let i = 0; i < numTrainImages; i++) {
      const [image, label] = extractDigit(i);
      trainImages.push(image);
      trainLabels.push(label);
    }
    
    // Generate test data (last 10k images)
    for (let i = 0; i < numTestImages; i++) {
      const [image, label] = extractDigit(numTrainImages + i);
      testImages.push(image);
      testLabels.push(label);
    }
    
    console.log(`Loaded ${trainImages.length} training images and ${testImages.length} test images`);
    
    return {
      trainImages,
      trainLabels,
      testImages,
      testLabels
    };
  } catch (error) {
    console.error('Error loading MNIST data:', error);
    
    // Fallback: Generate synthetic data if loading fails
    return generateSyntheticMnistData();
  }
};

// Generate synthetic MNIST-like data for demonstration as fallback
const generateSyntheticMnistData = () => {
  const numTrainImages = 1000;
  const numTestImages = 200;
  const imageSize = 28 * 28; // 28x28 pixels
  
  const trainImages: number[][] = [];
  const trainLabels: number[] = [];
  const testImages: number[][] = [];
  const testLabels: number[] = [];
  
  // Generate training data
  for (let i = 0; i < numTrainImages; i++) {
    const label = i % 10; // Labels 0-9
    const image = generateSyntheticDigit(label);
    trainImages.push(image);
    trainLabels.push(label);
  }
  
  // Generate test data
  for (let i = 0; i < numTestImages; i++) {
    const label = i % 10;
    const image = generateSyntheticDigit(label);
    testImages.push(image);
    testLabels.push(label);
  }
  
  return {
    trainImages,
    trainLabels,
    testImages,
    testLabels
  };
};

// Generate a synthetic digit image
const generateSyntheticDigit = (digit: number): number[] => {
  const size = 28;
  const image = Array(size * size).fill(0);
  
  // Define simple patterns for each digit
  switch (digit) {
    case 0: // Circle
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const dx = i - size / 2;
          const dy = j - size / 2;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 5 && distance < 10) {
            image[i * size + j] = 0.8 + Math.random() * 0.2;
          }
        }
      }
      break;
    case 1: // Vertical line
      for (let i = 5; i < size - 5; i++) {
        const center = Math.floor(size / 2);
        image[i * size + center] = 0.8 + Math.random() * 0.2;
        image[i * size + center + 1] = 0.8 + Math.random() * 0.2;
      }
      break;
    case 2: // Horizontal lines and curve
      for (let j = 5; j < size - 5; j++) {
        image[5 * size + j] = 0.8 + Math.random() * 0.2;
        image[15 * size + j] = 0.8 + Math.random() * 0.2;
      }
      for (let i = 5; i < 15; i++) {
        image[i * size + size - 5 - i] = 0.8 + Math.random() * 0.2;
      }
      break;
    case 3: // Two horizontal lines and right edge
      for (let j = 5; j < size - 5; j++) {
        image[5 * size + j] = 0.8 + Math.random() * 0.2;
        image[15 * size + j] = 0.8 + Math.random() * 0.2;
      }
      for (let i = 5; i < 15; i++) {
        image[i * size + size - 5] = 0.8 + Math.random() * 0.2;
      }
      break;
    case 4: // Cross pattern
      for (let i = 5; i < size - 5; i++) {
        image[i * size + size / 2] = 0.8 + Math.random() * 0.2;
        image[size / 2 * size + i] = 0.8 + Math.random() * 0.2;
      }
      break;
    case 5: // Reverse L shape
      for (let j = 5; j < size - 5; j++) {
        image[5 * size + j] = 0.8 + Math.random() * 0.2;
        image[15 * size + j] = 0.8 + Math.random() * 0.2;
      }
      for (let i = 5; i < 15; i++) {
        image[i * size + 5] = 0.8 + Math.random() * 0.2;
      }
      break;
    case 6: // Curved line
      for (let i = 5; i < size - 5; i++) {
        const j = Math.sin((i - 5) / (size - 10) * Math.PI) * 10 + size / 2;
        image[i * size + Math.floor(j)] = 0.8 + Math.random() * 0.2;
      }
      break;
    case 7: // Diagonal line
      for (let i = 5; i < size - 5; i++) {
        image[i * size + i] = 0.8 + Math.random() * 0.2;
      }
      break;
    case 8: // Two circles
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const dx1 = i - size / 3;
          const dy1 = j - size / 3;
          const dx2 = i - 2 * size / 3;
          const dy2 = j - 2 * size / 3;
          const distance1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
          const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (distance1 < 5 || distance2 < 5) {
            image[i * size + j] = 0.8 + Math.random() * 0.2;
          }
        }
      }
      break;
    case 9: // Curved line with dot
      for (let i = 5; i < size / 2; i++) {
        for (let j = 5; j < size - 5; j++) {
          const dx = j - size / 2;
          const dy = i - size / 4;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 5 && distance < 8) {
            image[i * size + j] = 0.8 + Math.random() * 0.2;
          }
        }
      }
      // Add a dot
      for (let i = size / 2 + 3; i < size / 2 + 6; i++) {
        for (let j = size / 2 - 1; j < size / 2 + 2; j++) {
          image[i * size + j] = 0.8 + Math.random() * 0.2;
        }
      }
      break;
    default:
      // Random pixels as fallback
      for (let i = 0; i < 100; i++) {
        const pos = Math.floor(Math.random() * (size * size));
        image[pos] = 0.8 + Math.random() * 0.2;
      }
  }
  
  // Add some noise
  for (let i = 0; i < image.length; i++) {
    if (image[i] > 0) {
      // Add noise to the digit pixels
      image[i] = Math.min(1, image[i] + (Math.random() - 0.5) * 0.1);
    } else {
      // Add background noise
      image[i] = Math.random() * 0.1;
    }
  }
  
  return image;
};

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

// Utility to visualize a digit on a canvas element - improved for clarity
export const renderDigitToCanvas = (canvas: HTMLCanvasElement, image: number[]): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const size = Math.sqrt(image.length);
  const imageData = ctx.createImageData(size, size);
  
  for (let i = 0; i < image.length; i++) {
    const value = Math.floor(image[i] * 255);
    // RGBA values (grayscale with black background and white digits)
    imageData.data[i * 4] = value;     // R
    imageData.data[i * 4 + 1] = value; // G
    imageData.data[i * 4 + 2] = value; // B
    imageData.data[i * 4 + 3] = 255;   // A (fully opaque)
  }
  
  ctx.putImageData(imageData, 0, 0);
};
