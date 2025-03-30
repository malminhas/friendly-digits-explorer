// Pre-generated synthetic MNIST digits with enhanced variation

// Generate a synthetic digit image that more closely resembles handwritten digits
export const generateSyntheticDigit = (digit: number, isTestSet: boolean = false): number[] => {
  const size = 28;
  const image = Array(size * size).fill(0);
  
  // Enhanced randomization for test set
  const randomFactor = isTestSet ? 1.5 : 1.0;
  
  // Center point with more variation for test set
  const centerX = size / 2 + (Math.random() - 0.5) * 6 * randomFactor;
  const centerY = size / 2 + (Math.random() - 0.5) * 6 * randomFactor;
  
  // Enhanced variation in stroke properties
  const thickness = (1.0 + Math.random() * 2.5) * randomFactor;
  const distortion = (0.3 + Math.random() * 2.0) * randomFactor;
  const slant = (Math.random() - 0.5) * 0.6 * randomFactor;
  const rotation = (Math.random() - 0.5) * Math.PI / 6 * randomFactor; // Random rotation up to ±30 degrees
  
  // Function to rotate a point around center
  const rotatePoint = (x: number, y: number): [number, number] => {
    const dx = x - centerX;
    const dy = y - centerY;
    const rotatedX = dx * Math.cos(rotation) - dy * Math.sin(rotation) + centerX;
    const rotatedY = dx * Math.sin(rotation) + dy * Math.cos(rotation) + centerY;
    return [rotatedX, rotatedY];
  };
  
  // Enhanced pixel drawing with more natural variation
  const drawPixel = (x: number, y: number, intensity = 1) => {
    // Apply rotation
    const [rotX, rotY] = rotatePoint(x, y);
    
    // Apply slant
    const slantedX = rotX + (rotY - centerY) * slant;
    
    // Add random variation to position
    const finalX = slantedX + (Math.random() - 0.5) * distortion;
    const finalY = rotY + (Math.random() - 0.5) * distortion;
    
    // Enhanced Gaussian-like distribution for more natural strokes
    for (let dy = -thickness; dy <= thickness; dy++) {
      for (let dx = -thickness; dx <= thickness; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > thickness) continue;
        
        const pixelX = Math.round(finalX + dx);
        const pixelY = Math.round(finalY + dy);
        
        if (pixelX >= 0 && pixelX < size && pixelY >= 0 && pixelY < size) {
          const pixelIntensity = intensity * Math.exp(-distance / thickness);
          const index = pixelY * size + pixelX;
          image[index] = Math.max(image[index], pixelIntensity);
        }
      }
    }
  };
  
  // Enhanced curve drawing with more natural variation
  const drawCurve = (points: [number, number][], intensity = 1) => {
    const numSteps = Math.ceil(points.length * 10);
    for (let i = 0; i < numSteps; i++) {
      const t = i / (numSteps - 1);
      let x = 0;
      let y = 0;
      
      // Enhanced Bezier curve calculation
      for (let j = 0; j < points.length; j++) {
        const b = bernstein(points.length - 1, j, t);
        x += points[j][0] * b;
        y += points[j][1] * b;
      }
      
      // Add slight random variation to each point
      x += (Math.random() - 0.5) * distortion;
      y += (Math.random() - 0.5) * distortion;
      
      drawPixel(x, y, intensity);
    }
  };
  
  // Enhanced line drawing with more natural variation
  const drawLine = (x1: number, y1: number, x2: number, y2: number, intensity = 1) => {
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const steps = Math.ceil(distance * 4);
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * distortion;
      const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * distortion;
      drawPixel(x, y, intensity);
    }
  };
  
  // Helper function for Bezier curves
  const bernstein = (n: number, k: number, t: number): number => {
    const binomial = (n: number, k: number): number => {
      let result = 1;
      for (let i = 1; i <= k; i++) {
        result *= (n - k + i) / i;
      }
      return result;
    };
    return binomial(n, k) * Math.pow(t, k) * Math.pow(1 - t, n - k);
  };
  
  // More style variations for each digit
  const variation = Math.floor(Math.random() * 10); // 0-9 different styles (doubled from 5)
  
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
        // Traditional 5 with straight top
        drawLine(centerX + 8, centerY - 10, centerX - 8, centerY - 10, 0.9);
        drawLine(centerX - 8, centerY - 10, centerX - 8, centerY, 0.9);
        drawCurve([
          [centerX - 8, centerY],
          [centerX - 3, centerY - 2],
          [centerX + 6, centerY],
          [centerX + 8, centerY + 4],
          [centerX + 6, centerY + 8],
          [centerX, centerY + 10],
          [centerX - 6, centerY + 8]
        ], 0.9);
      } else if (variation === 1) {
        // Cursive 5 with top curve
        drawCurve([
          [centerX + 6, centerY - 10],  // Start from top right
          [centerX, centerY - 10],      // Curve across top
          [centerX - 6, centerY - 8],   // Down to middle
          [centerX - 8, centerY - 4],
          [centerX - 8, centerY],       // Middle connection
          [centerX - 3, centerY - 2],   // Start of bottom curve
          [centerX + 6, centerY],
          [centerX + 8, centerY + 4],
          [centerX + 6, centerY + 8],
          [centerX, centerY + 10],
          [centerX - 6, centerY + 8]
        ], 0.9);
      } else if (variation === 2) {
        // Flowing cursive 5 with continuous stroke
        drawCurve([
          [centerX + 8, centerY - 10],   // Start from top right
          [centerX, centerY - 10],       // Flow across top
          [centerX - 6, centerY - 8],    // Curve down
          [centerX - 8, centerY - 4],    // Continue curve
          [centerX - 6, centerY],        // Middle curve
          [centerX - 2, centerY - 2],    // Slight upward curve
          [centerX + 4, centerY],        // Start bottom curve
          [centerX + 8, centerY + 4],    // Continue bottom
          [centerX + 6, centerY + 8],    // Round the corner
          [centerX, centerY + 10],       // Bottom curve
          [centerX - 6, centerY + 8]     // Finish bottom
        ], 0.9);
      } else if (variation === 3) {
        // Modern cursive 5 with open top
        drawCurve([
          [centerX + 6, centerY - 10],   // Start from top
          [centerX - 2, centerY - 8],    // Curve down
          [centerX - 6, centerY - 4],    // Continue down
          [centerX - 8, centerY],        // Middle
          [centerX - 4, centerY - 2],    // Curve back
          [centerX + 2, centerY],        // Start bottom
          [centerX + 8, centerY + 4],    // Bottom curve
          [centerX + 6, centerY + 8],    // Round corner
          [centerX, centerY + 10],       // Complete bottom
          [centerX - 6, centerY + 8]     // Finish
        ], 0.9);
      } else {
        // Angular modern 5
        drawLine(centerX + 6, centerY - 10, centerX - 6, centerY - 10, 0.9);
        drawLine(centerX - 6, centerY - 10, centerX - 8, centerY - 4, 0.9);
        drawLine(centerX - 8, centerY - 4, centerX - 4, centerY, 0.9);
        drawLine(centerX - 4, centerY, centerX + 6, centerY, 0.9);
        drawCurve([
          [centerX + 6, centerY],
          [centerX + 8, centerY + 4],
          [centerX + 6, centerY + 8],
          [centerX, centerY + 10],
          [centerX - 6, centerY + 8]
        ], 0.9);
      }
      break;
    }
    case 6: {
      if (variation === 0) {
        // Classic curved 6
        drawCurve([
          [centerX + 2, centerY - 10],   // Start from top
          [centerX - 2, centerY - 8],    // Curve left
          [centerX - 6, centerY - 4],    // Continue down
          [centerX - 8, centerY + 2],    // Bottom curve start
          [centerX - 6, centerY + 8],    // Bottom curve
          [centerX, centerY + 10],       // Bottom
          [centerX + 6, centerY + 8],    // Right side
          [centerX + 8, centerY + 2],    // Top of loop
          [centerX + 6, centerY - 2],    // Close loop
          [centerX, centerY],            // Center
          [centerX - 4, centerY + 2],    // Inner curve
        ], 0.9);
      } else if (variation === 1) {
        // Cursive style 6 with flowing top
        drawCurve([
          [centerX + 4, centerY - 10],   // Start higher
          [centerX, centerY - 8],        // Curve in
          [centerX - 4, centerY - 4],    // Flow down
          [centerX - 8, centerY + 2],    // Continue curve
          [centerX - 6, centerY + 8],    // Bottom curve
          [centerX, centerY + 10],       // Bottom point
          [centerX + 6, centerY + 8],    // Right side
          [centerX + 8, centerY + 2],    // Complete loop
          [centerX + 6, centerY - 2],    // Top of loop
          [centerX - 2, centerY],        // Inner detail
        ], 0.9);
      } else if (variation === 2) {
        // Modern 6 with open loop
        drawCurve([
          [centerX + 2, centerY - 10],   // Top start
          [centerX - 4, centerY - 6],    // Curve down
          [centerX - 8, centerY],        // Middle
          [centerX - 8, centerY + 4],    // Continue down
          [centerX - 6, centerY + 8],    // Bottom curve
          [centerX, centerY + 10],       // Bottom
          [centerX + 6, centerY + 8],    // Right side
          [centerX + 8, centerY + 2],    // Loop top
          [centerX + 4, centerY - 2],    // Complete loop
        ], 0.9);
      } else if (variation === 3) {
        // Straight-top 6 with round bottom
        drawLine(centerX + 4, centerY - 10, centerX - 4, centerY - 4, 0.9);
        drawCurve([
          [centerX - 4, centerY - 4],    // Connect from top
          [centerX - 8, centerY],        // Left side
          [centerX - 8, centerY + 4],    // Continue curve
          [centerX - 6, centerY + 8],    // Bottom left
          [centerX, centerY + 10],       // Bottom
          [centerX + 6, centerY + 8],    // Bottom right
          [centerX + 8, centerY + 2],    // Right side
          [centerX + 6, centerY - 2],    // Top of loop
          [centerX, centerY],            // Center
          [centerX - 4, centerY + 2],    // Inner detail
        ], 0.9);
      } else {
        // Angular 6 with smooth transitions
        drawLine(centerX + 2, centerY - 10, centerX - 4, centerY - 6, 0.9);
        drawLine(centerX - 4, centerY - 6, centerX - 6, centerY - 2, 0.9);
        drawCurve([
          [centerX - 6, centerY - 2],    // Connect from top
          [centerX - 8, centerY + 2],    // Left side
          [centerX - 6, centerY + 8],    // Bottom curve
          [centerX, centerY + 10],       // Bottom
          [centerX + 6, centerY + 8],    // Right side
          [centerX + 8, centerY + 2],    // Top of loop
          [centerX + 6, centerY - 2],    // Complete loop
          [centerX, centerY],            // Center
          [centerX - 4, centerY + 2],    // Inner detail
        ], 0.9);
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
        // Classic stacked circles 8
        const numPoints = 12;  // Increased points for smoother circles
        // Top circle - slightly smaller
        const pointsTop: [number, number][] = [];
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;  // Complete circle
          const x = centerX + 4 * Math.cos(angle) + (Math.random() - 0.5);
          const y = centerY - 4 + 4 * Math.sin(angle) + (Math.random() - 0.5);
          pointsTop.push([x, y]);
        }
        pointsTop.push(pointsTop[0]);  // Close the circle
        drawCurve(pointsTop, 0.9);
        
        // Bottom circle - slightly larger
        const pointsBottom: [number, number][] = [];
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;  // Complete circle
          const x = centerX + 5 * Math.cos(angle) + (Math.random() - 0.5);
          const y = centerY + 4 + 5 * Math.sin(angle) + (Math.random() - 0.5);
          pointsBottom.push([x, y]);
        }
        pointsBottom.push(pointsBottom[0]);  // Close the circle
        drawCurve(pointsBottom, 0.9);
      } else if (variation === 1) {
        // Continuous flowing 8
        drawCurve([
          [centerX, centerY - 10],       // Top center
          [centerX + 6, centerY - 8],    // Top right
          [centerX + 8, centerY - 4],    // Upper right
          [centerX + 6, centerY],        // Middle right
          [centerX + 8, centerY + 4],    // Lower right
          [centerX + 6, centerY + 8],    // Bottom right
          [centerX, centerY + 10],       // Bottom center
          [centerX - 6, centerY + 8],    // Bottom left
          [centerX - 8, centerY + 4],    // Lower left
          [centerX - 6, centerY],        // Middle left
          [centerX - 8, centerY - 4],    // Upper left
          [centerX - 6, centerY - 8],    // Top left
          [centerX, centerY - 10],       // Back to top
        ], 0.9);
      } else if (variation === 2) {
        // Block style 8 with sharp corners
        // Top square
        drawLine(centerX - 5, centerY - 10, centerX + 5, centerY - 10, 0.9);
        drawLine(centerX + 5, centerY - 10, centerX + 5, centerY - 2, 0.9);
        drawLine(centerX + 5, centerY - 2, centerX - 5, centerY - 2, 0.9);
        drawLine(centerX - 5, centerY - 2, centerX - 5, centerY - 10, 0.9);
        
        // Bottom square
        drawLine(centerX - 6, centerY + 2, centerX + 6, centerY + 2, 0.9);
        drawLine(centerX + 6, centerY + 2, centerX + 6, centerY + 10, 0.9);
        drawLine(centerX + 6, centerY + 10, centerX - 6, centerY + 10, 0.9);
        drawLine(centerX - 6, centerY + 10, centerX - 6, centerY + 2, 0.9);
      } else if (variation === 3) {
        // Calligraphic 8 with thick-thin variation
        drawCurve([
          [centerX, centerY - 10],       // Start at top
          [centerX + 7, centerY - 8],    // Wide curve right
          [centerX + 8, centerY - 4],
          [centerX + 6, centerY],        // Pinch at middle
          [centerX + 8, centerY + 4],    // Expand again
          [centerX + 7, centerY + 8],
          [centerX, centerY + 10],       // Bottom point
          [centerX - 7, centerY + 8],
          [centerX - 8, centerY + 4],
          [centerX - 6, centerY],        // Pinch at middle
          [centerX - 8, centerY - 4],
          [centerX - 7, centerY - 8],
          [centerX, centerY - 10],       // Back to top
        ], 0.9);
      } else {
        // Modern geometric 8
        // Top diamond
        drawCurve([
          [centerX, centerY - 10],
          [centerX + 6, centerY - 5],
          [centerX, centerY],
          [centerX - 6, centerY - 5],
          [centerX, centerY - 10],
        ], 0.9);
        
        // Bottom diamond
        drawCurve([
          [centerX, centerY],
          [centerX + 7, centerY + 5],
          [centerX, centerY + 10],
          [centerX - 7, centerY + 5],
          [centerX, centerY],
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
  
  // Add enhanced noise and distortion
  for (let i = 0; i < image.length; i++) {
    // Add more background noise for test set
    if (image[i] === 0) {
      const noiseThreshold = isTestSet ? 0.02 : 0.01;
      const noiseIntensity = isTestSet ? 0.15 : 0.1;
      if (Math.random() < noiseThreshold) {
        image[i] = Math.random() * noiseIntensity;
      }
    }
    // Add more variance to digit pixels
    else if (image[i] > 0) {
      const variance = isTestSet ? 0.2 : 0.1;
      image[i] = Math.min(1, image[i] + (Math.random() - 0.5) * variance);
    }
  }
  
  return image;
};

// Generate the digits with enhanced variation
const generateMnistData = () => {
  const digits: { [key: string]: { train: number[][], test: number[][] } } = {};
  
  // Generate training and test variations for each digit
  for (let digit = 0; digit < 10; digit++) {
    digits[digit] = { train: [], test: [] };
    
    // Generate training variations (180 per digit)
    for (let i = 0; i < 180; i++) {
      digits[digit].train.push(generateSyntheticDigit(digit, false));
    }
    
    // Generate test variations (20 per digit) with more randomization
    for (let i = 0; i < 20; i++) {
      digits[digit].test.push(generateSyntheticDigit(digit, true));
    }
  }
  
  return digits;
};

// Pre-generated MNIST data with separate train and test sets
export const MNIST_DATA = generateMnistData();

// Helper function to get a specific variation of a digit
export const getDigitVariation = (digit: number, variation: number): number[] => {
  if (digit < 0 || digit > 9) {
    throw new Error('Invalid digit');
  }
  
  // Use test set for variations 180-199
  if (variation >= 180) {
    const testVariation = variation - 180;
    if (testVariation >= 20) {
      throw new Error('Invalid variation');
    }
    return MNIST_DATA[digit].test[testVariation];
  }
  
  // Use training set for variations 0-179
  return MNIST_DATA[digit].train[variation];
};

// Helper function to get a random variation of a digit
export const getRandomDigitVariation = (digit: number, useTestSet: boolean = false): number[] => {
  if (digit < 0 || digit > 9) {
    throw new Error('Invalid digit');
  }
  
  if (useTestSet) {
    const variation = Math.floor(Math.random() * 20);
    return MNIST_DATA[digit].test[variation];
  }
  
  const variation = Math.floor(Math.random() * 180);
  return MNIST_DATA[digit].train[variation];
}; 