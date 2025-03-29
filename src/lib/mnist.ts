
// This is a simplified implementation to load and work with MNIST data in the browser

// Updated reliable MNIST data source
const MNIST_IMAGES_URL = 'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png';
const MNIST_LABELS_URL = 'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8';

// Load MNIST data from reliable sources
export const loadMnistData = async () => {
  try {
    console.log("Attempting to load MNIST data...");
    
    // Try to fetch both images and labels
    const [imagesResponse, labelsResponse] = await Promise.all([
      fetch(MNIST_IMAGES_URL),
      fetch(MNIST_LABELS_URL)
    ]);
    
    if (!imagesResponse.ok || !labelsResponse.ok) {
      throw new Error(`Failed to fetch MNIST data: Images status ${imagesResponse.status}, Labels status ${labelsResponse.status}`);
    }
    
    // Process the image data
    const imageBlob = await imagesResponse.blob();
    const imageBitmap = await createImageBitmap(imageBlob);
    
    // Process the label data
    const labelBuffer = await labelsResponse.arrayBuffer();
    const labels = new Uint8Array(labelBuffer);
    
    console.log("Successfully loaded MNIST data");
    
    // Process the MNIST bitmap data into pixel arrays
    const trainImages: number[][] = [];
    const trainLabels: number[] = [];
    const testImages: number[][] = [];
    const testLabels: number[] = [];
    
    // Extract pixel data from the image
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) {
      throw new Error("Could not create canvas context");
    }
    
    // Process first 60000 for training, rest for testing
    const totalImages = Math.min(65000, labels.length); // Limit to available labels
    
    for (let i = 0; i < totalImages; i++) {
      const imgX = (i % 100) * 28;
      const imgY = Math.floor(i / 100) * 28;
      
      ctx.clearRect(0, 0, 28, 28);
      ctx.drawImage(imageBitmap, imgX, imgY, 28, 28, 0, 0, 28, 28);
      
      const imageData = ctx.getImageData(0, 0, 28, 28);
      const pixels = new Array(28 * 28);
      
      // Convert RGBA to grayscale and normalize to 0-1
      for (let j = 0; j < imageData.data.length / 4; j++) {
        // Take just the red channel (grayscale image)
        pixels[j] = imageData.data[j * 4] / 255;
      }
      
      // Sort into training and test sets
      if (i < 60000) {
        trainImages.push(pixels);
        trainLabels.push(labels[i]);
      } else {
        testImages.push(pixels);
        testLabels.push(labels[i]);
      }
      
      // Limit the data size for browser performance
      if (trainImages.length >= 10000 && testImages.length >= 1000) {
        break;
      }
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
    console.log("Falling back to synthetic data generation");
    
    // Fallback: Generate synthetic data if loading fails
    return generateSyntheticMnistData();
  }
};

// Generate synthetic MNIST-like data for demonstration
const generateSyntheticMnistData = () => {
  const numTrainImages = 1000;
  const numTestImages = 200;
  
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
  
  console.log('Using synthetic MNIST data as fallback');
  
  return {
    trainImages,
    trainLabels,
    testImages,
    testLabels
  };
};

// Generate a synthetic digit image that more closely resembles handwritten digits
const generateSyntheticDigit = (digit: number): number[] => {
  const size = 28;
  const image = Array(size * size).fill(0);
  
  // Center point of the image
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Thickness and variance for more natural looking strokes
  const thickness = 2 + Math.random();
  const distortion = 0.7; // How much random distortion to apply
  
  // Function to draw a "pixel" with thickness and some randomness
  const drawPixel = (x: number, y: number, intensity = 1) => {
    // Add some random offset for more natural look
    const offsetX = (Math.random() - 0.5) * distortion;
    const offsetY = (Math.random() - 0.5) * distortion;
    
    const baseX = Math.floor(x + offsetX);
    const baseY = Math.floor(y + offsetY);
    
    // Draw a thicker point
    for (let dx = -thickness; dx <= thickness; dx++) {
      for (let dy = -thickness; dy <= thickness; dy++) {
        const pixelX = baseX + Math.floor(dx);
        const pixelY = baseY + Math.floor(dy);
        
        // Check if within bounds
        if (pixelX >= 0 && pixelX < size && pixelY >= 0 && pixelY < size) {
          // Distance from center of the pixel
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= thickness) {
            // Intensity falls off with distance from center
            const pixelIntensity = intensity * Math.max(0, (thickness - dist) / thickness);
            const index = pixelY * size + pixelX;
            // Use maximum value when points overlap
            image[index] = Math.max(image[index], pixelIntensity);
          }
        }
      }
    }
  };
  
  // Function to draw a line between two points
  const drawLine = (x1: number, y1: number, x2: number, y2: number, intensity = 1) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 3; // Ensure enough points for a smooth line
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + dx * t;
      const y = y1 + dy * t;
      drawPixel(x, y, intensity);
    }
  };
  
  // Function to draw a curve between points
  const drawCurve = (points: [number, number][], intensity = 1) => {
    for (let i = 0; i < points.length - 1; i++) {
      drawLine(points[i][0], points[i][1], points[i+1][0], points[i+1][1], intensity);
    }
  };
  
  const generateRandomPoints = (basePoints: [number, number][], variance: number): [number, number][] => {
    return basePoints.map(([x, y]) => [
      x + (Math.random() - 0.5) * variance,
      y + (Math.random() - 0.5) * variance
    ]);
  };
  
  // Different style variations for each digit
  const variation = Math.floor(Math.random() * 3); // 0, 1, or 2 different styles
  
  switch (digit) {
    case 0: { // Circle/Oval for zero
      const numPoints = 12;
      const radiusX = 8 + Math.random() * 2;
      const radiusY = 8 + Math.random() * 3;
      const points: [number, number][] = [];
      
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const x = centerX + radiusX * Math.cos(angle) + (Math.random() - 0.5) * 2;
        const y = centerY + radiusY * Math.sin(angle) + (Math.random() - 0.5) * 2;
        points.push([x, y]);
      }
      // Connect back to start
      points.push(points[0]);
      drawCurve(points, 0.9);
      break;
    }
    case 1: { // Vertical line for one
      const height = 16 + Math.random() * 4;
      const topY = centerY - height/2;
      const lean = (Math.random() - 0.5) * 5; // How much the 1 leans
      
      // Different styles of 1
      if (variation === 0) { 
        // Simple straight line
        drawLine(centerX + lean, topY, centerX, topY + height, 0.9);
        // Small serif at the top sometimes
        if (Math.random() > 0.5) {
          drawLine(centerX - 3, topY, centerX + lean, topY, 0.9);
        }
      } else {
        // Line with a slant at top
        drawLine(centerX - 4, topY, centerX, topY + 4, 0.9);
        drawLine(centerX, topY + 4, centerX, topY + height, 0.9);
      }
      // Base sometimes
      if (Math.random() > 0.3) {
        drawLine(centerX - 4, topY + height, centerX + 4, topY + height, 0.9);
      }
      break;
    }
    case 2: {
      if (variation === 0) {
        // Curved top, straight diagonal bottom
        drawCurve([
          [centerX + 6, centerY - 7],
          [centerX, centerY - 10],
          [centerX - 6, centerY - 7],
          [centerX - 8, centerY - 2],
          [centerX - 5, centerY + 2],
          [centerX, centerY + 6],
          [centerX + 8, centerY + 10]
        ], 0.9);
        drawLine(centerX - 8, centerY + 10, centerX + 8, centerY + 10, 0.9);
      } else {
        // More angular 2
        drawLine(centerX - 6, centerY - 8, centerX + 6, centerY - 8, 0.9);
        drawLine(centerX + 6, centerY - 8, centerX + 6, centerY, 0.9);
        drawLine(centerX + 6, centerY, centerX - 6, centerY + 8, 0.9);
        drawLine(centerX - 6, centerY + 8, centerX + 8, centerY + 8, 0.9);
      }
      break;
    }
    case 3: {
      if (variation === 0) {
        // Curved 3
        drawCurve([
          [centerX - 6, centerY - 8],
          [centerX, centerY - 10],
          [centerX + 6, centerY - 8],
          [centerX + 8, centerY - 2],
          [centerX + 2, centerY],
          [centerX + 8, centerY + 2],
          [centerX + 6, centerY + 8],
          [centerX, centerY + 10],
          [centerX - 6, centerY + 8]
        ], 0.9);
      } else {
        // More angular 3
        drawLine(centerX - 6, centerY - 8, centerX + 6, centerY - 8, 0.9);
        drawLine(centerX + 6, centerY - 8, centerX + 6, centerY, 0.9);
        drawLine(centerX - 4, centerY, centerX + 6, centerY, 0.9);
        drawLine(centerX + 6, centerY, centerX + 6, centerY + 8, 0.9);
        drawLine(centerX - 6, centerY + 8, centerX + 6, centerY + 8, 0.9);
      }
      break;
    }
    case 4: {
      if (variation === 0) {
        // Traditional 4
        drawLine(centerX + 4, centerY - 10, centerX + 4, centerY + 10, 0.9);
        drawLine(centerX - 8, centerY, centerX + 8, centerY, 0.9);
        drawLine(centerX - 8, centerY, centerX + 4, centerY - 10, 0.9);
      } else {
        // Open 4
        drawLine(centerX - 6, centerY - 6, centerX - 6, centerY + 2, 0.9);
        drawLine(centerX - 6, centerY + 2, centerX + 6, centerY + 2, 0.9);
        drawLine(centerX + 6, centerY - 10, centerX + 6, centerY + 10, 0.9);
      }
      break;
    }
    case 5: {
      if (variation === 0) {
        // Curved bottom 5
        drawLine(centerX + 8, centerY - 10, centerX - 8, centerY - 10, 0.9);
        drawLine(centerX - 8, centerY - 10, centerX - 8, centerY, 0.9);
        drawCurve([
          [centerX - 8, centerY],
          [centerX - 3, centerY - 2],
          [centerX + 4, centerY],
          [centerX + 8, centerY + 4],
          [centerX + 6, centerY + 8],
          [centerX, centerY + 10],
          [centerX - 6, centerY + 8]
        ], 0.9);
      } else {
        // Angular 5
        drawLine(centerX + 6, centerY - 10, centerX - 6, centerY - 10, 0.9);
        drawLine(centerX - 6, centerY - 10, centerX - 6, centerY, 0.9);
        drawLine(centerX - 6, centerY, centerX + 6, centerY, 0.9);
        drawLine(centerX + 6, centerY, centerX + 6, centerY + 10, 0.9);
        drawLine(centerX - 6, centerY + 10, centerX + 6, centerY + 10, 0.9);
      }
      break;
    }
    case 6: {
      if (variation === 0) {
        // Looped 6
        drawCurve([
          [centerX + 2, centerY - 10],
          [centerX - 6, centerY - 4],
          [centerX - 8, centerY + 2],
          [centerX - 6, centerY + 8],
          [centerX, centerY + 10],
          [centerX + 6, centerY + 8],
          [centerX + 8, centerY + 2],
          [centerX + 6, centerY - 4],
          [centerX, centerY - 2],
          [centerX - 6, centerY],
        ], 0.9);
      } else {
        // More angular 6
        drawLine(centerX + 4, centerY - 10, centerX - 4, centerY - 4, 0.9);
        drawLine(centerX - 4, centerY - 4, centerX - 6, centerY, 0.9);
        drawLine(centerX - 6, centerY, centerX - 6, centerY + 6, 0.9);
        drawLine(centerX - 6, centerY + 6, centerX - 2, centerY + 10, 0.9);
        drawLine(centerX - 2, centerY + 10, centerX + 4, centerY + 10, 0.9);
        drawLine(centerX + 4, centerY + 10, centerX + 6, centerY + 6, 0.9);
        drawLine(centerX + 6, centerY + 6, centerX + 6, centerY + 2, 0.9);
        drawLine(centerX + 6, centerY + 2, centerX + 2, centerY - 2, 0.9);
        drawLine(centerX + 2, centerY - 2, centerX - 4, centerY - 2, 0.9);
      }
      break;
    }
    case 7: {
      if (variation === 0) {
        // Straight 7
        drawLine(centerX - 8, centerY - 10, centerX + 8, centerY - 10, 0.9);
        drawLine(centerX + 8, centerY - 10, centerX - 4, centerY + 10, 0.9);
      } else {
        // 7 with horizontal stroke in the middle
        drawLine(centerX - 6, centerY - 10, centerX + 6, centerY - 10, 0.9);
        drawLine(centerX + 6, centerY - 10, centerX, centerY + 10, 0.9);
        drawLine(centerX - 4, centerY, centerX + 4, centerY, 0.9);
      }
      break;
    }
    case 8: {
      if (variation === 0) {
        // Curved 8 (two circles)
        const numPoints = 10;
        // Top circle
        const pointsTop: [number, number][] = [];
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI;
          const x = centerX + 5 * Math.cos(angle + Math.PI) + (Math.random() - 0.5) * 1.5;
          const y = centerY - 5 + 5 * Math.sin(angle + Math.PI) + (Math.random() - 0.5) * 1.5;
          pointsTop.push([x, y]);
        }
        drawCurve(pointsTop, 0.9);
        
        // Bottom circle
        const pointsBottom: [number, number][] = [];
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI;
          const x = centerX + 6 * Math.cos(angle) + (Math.random() - 0.5) * 1.5;
          const y = centerY + 5 + 5 * Math.sin(angle) + (Math.random() - 0.5) * 1.5;
          pointsBottom.push([x, y]);
        }
        drawCurve(pointsBottom, 0.9);
      } else {
        // More angular 8
        drawCurve([
          [centerX, centerY - 10],
          [centerX - 6, centerY - 8],
          [centerX - 6, centerY - 2],
          [centerX, centerY],
          [centerX + 6, centerY + 2],
          [centerX + 6, centerY + 8],
          [centerX, centerY + 10],
          [centerX - 6, centerY + 8],
          [centerX - 6, centerY + 2],
          [centerX, centerY],
          [centerX + 6, centerY - 2],
          [centerX + 6, centerY - 8],
          [centerX, centerY - 10]
        ], 0.9);
      }
      break;
    }
    case 9: {
      if (variation === 0) {
        // Curved 9
        drawCurve([
          [centerX, centerY - 8],
          [centerX - 6, centerY - 6],
          [centerX - 8, centerY - 2],
          [centerX - 6, centerY + 2],
          [centerX, centerY + 4],
          [centerX + 6, centerY + 2],
          [centerX + 8, centerY - 2],
          [centerX + 6, centerY - 6],
          [centerX, centerY - 8],
          [centerX + 4, centerY - 8],
          [centerX + 4, centerY + 10]
        ], 0.9);
      } else {
        // More angular 9
        drawLine(centerX - 4, centerY - 8, centerX + 4, centerY - 8, 0.9);
        drawLine(centerX + 4, centerY - 8, centerX + 6, centerY - 4, 0.9);
        drawLine(centerX + 6, centerY - 4, centerX + 6, centerY, 0.9);
        drawLine(centerX + 6, centerY, centerX + 4, centerY + 4, 0.9);
        drawLine(centerX + 4, centerY + 4, centerX, centerY + 6, 0.9);
        drawLine(centerX, centerY + 6, centerX - 4, centerY + 4, 0.9);
        drawLine(centerX - 4, centerY + 4, centerX - 6, centerY, 0.9);
        drawLine(centerX - 6, centerY, centerX - 4, centerY - 4, 0.9);
        drawLine(centerX - 4, centerY - 4, centerX, centerY - 6, 0.9);
        drawLine(centerX, centerY - 6, centerX + 2, centerY - 8, 0.9);
        // Tail
        drawLine(centerX + 2, centerY - 2, centerX + 2, centerY + 10, 0.9);
      }
      break;
    }
    default:
      // Random pixels as fallback
      for (let i = 0; i < 100; i++) {
        const x = 5 + Math.random() * 18;
        const y = 5 + Math.random() * 18;
        drawPixel(x, y, 0.8 + Math.random() * 0.2);
      }
  }
  
  // Add some noise
  for (let i = 0; i < image.length; i++) {
    // Add slight noise to the background
    if (image[i] === 0 && Math.random() < 0.01) {
      image[i] = Math.random() * 0.1;
    }
    // Add some variance to the digit pixels
    else if (image[i] > 0) {
      image[i] = Math.min(1, image[i] + (Math.random() - 0.3) * 0.1);
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
  if (isNaN(size) || size <= 0) {
    console.error("Invalid image data for rendering", image);
    return;
  }
  
  const imageData = ctx.createImageData(size, size);
  
  // Clear the canvas first
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // MNIST values are naturally inverted (white digits on black background)
  // We'll invert them to show black digits on white background for better visibility
  for (let i = 0; i < image.length; i++) {
    const value = Math.floor(255 - (image[i] * 255)); // Invert colors
    // RGBA values (grayscale)
    imageData.data[i * 4] = value;     // R
    imageData.data[i * 4 + 1] = value; // G
    imageData.data[i * 4 + 2] = value; // B
    imageData.data[i * 4 + 3] = 255;   // A (fully opaque)
  }
  
  ctx.putImageData(imageData, 0, 0);
};
