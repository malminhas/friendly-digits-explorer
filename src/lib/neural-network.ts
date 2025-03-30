// Helper function to compute softmax probabilities with temperature scaling
export function softmax(logits: number[]): number[] {
  const temperature = 2.0; // Higher temperature = softer predictions
  const scaledLogits = logits.map(x => x / temperature);
  const maxLogit = Math.max(...scaledLogits);
  const expValues = scaledLogits.map(x => Math.exp(x - maxLogit));
  const sumExp = expValues.reduce((a, b) => a + b, 0);
  return expValues.map(x => x / sumExp);
}

// Improved initialization with He initialization for ReLU
export function initializeModel(hiddenNodes: number = 192) {
  const inputNodes = 784; // 28x28 pixels
  const outputNodes = 10; // 10 digits

  // He initialization scale factors (better for ReLU)
  const scale1 = Math.sqrt(2.0 / inputNodes);
  const scale2 = Math.sqrt(2.0 / hiddenNodes);

  // Initialize weights with He initialization
  const weights1 = Array(inputNodes).fill(0).map(() =>
    Array(hiddenNodes).fill(0).map(() => (Math.random() * 2 - 1) * scale1)
  );
  
  const weights2 = Array(hiddenNodes).fill(0).map(() =>
    Array(outputNodes).fill(0).map(() => (Math.random() * 2 - 1) * scale2)
  );

  // Initialize biases to small positive values to encourage initial activations
  const biases1 = Array(hiddenNodes).fill(0).map(() => 0.01);
  const biases2 = Array(outputNodes).fill(0).map(() => 0.01);

  return { weights1, weights2, biases1, biases2 };
}

// Apply dropout during training
function applyDropout(values: number[], rate: number = 0.3): number[] {
  if (rate === 0) return values;
  const scale = 1 / (1 - rate);
  return values.map(v => Math.random() > rate ? v * scale : 0);
}

// Improved ReLU with small slope for negative values (Leaky ReLU)
function leakyReLU(x: number): number {
  return x > 0 ? x : 0.01 * x;
}

function leakyReLUDerivative(x: number): number {
  return x > 0 ? 1 : 0.01;
}

// Forward pass through the network
function forwardPass(
  input: number[],
  weights1: number[][],
  weights2: number[][],
  biases1: number[],
  biases2: number[],
  isTraining: boolean = false
): { hidden: number[]; output: number[] } {
  console.log('Forward pass input stats:', {
    inputLength: input.length,
    nonZeroInputs: input.filter(x => x > 0).length,
    inputMin: Math.min(...input),
    inputMax: Math.max(...input)
  });

  // Normalize input
  const mean = input.reduce((a, b) => a + b, 0) / input.length;
  const std = Math.sqrt(input.reduce((a, b) => a + (b - mean) ** 2, 0) / input.length) + 1e-6;
  const normalizedInput = input.map(x => (x - mean) / std);
  
  console.log('Input normalization:', {
    mean,
    std,
    normalizedMin: Math.min(...normalizedInput),
    normalizedMax: Math.max(...normalizedInput)
  });

  // Hidden layer with Leaky ReLU activation
  const hidden = Array(weights1[0].length).fill(0);
  for (let j = 0; j < weights1[0].length; j++) {
    let sum = biases1[j];
    for (let i = 0; i < weights1.length; i++) {
      sum += normalizedInput[i] * weights1[i][j];
    }
    hidden[j] = leakyReLU(sum);
  }

  console.log('Hidden layer stats:', {
    hiddenLength: hidden.length,
    nonZeroHidden: hidden.filter(x => x > 0).length,
    hiddenMin: Math.min(...hidden),
    hiddenMax: Math.max(...hidden),
    avgHiddenActivation: hidden.reduce((a, b) => a + b, 0) / hidden.length
  });

  // Apply dropout during training
  const hiddenDropout = isTraining ? applyDropout(hidden, 0.3) : hidden;

  // Output layer
  const output = Array(weights2[0].length).fill(0);
  for (let k = 0; k < weights2[0].length; k++) {
    let sum = biases2[k];
    for (let j = 0; j < weights2.length; j++) {
      sum += hiddenDropout[j] * weights2[j][k];
    }
    output[k] = sum;
  }

  console.log('Output layer stats:', {
    outputLength: output.length,
    outputValues: output,
    outputMin: Math.min(...output),
    outputMax: Math.max(...output)
  });

  return { hidden: hiddenDropout, output };
}

// Make a prediction
export function predictDigit(
  input: number[],
  weights1: number[][],
  weights2: number[][],
  biases1: number[],
  biases2: number[]
): number {
  const { output } = forwardPass(input, weights1, weights2, biases1, biases2, false);
  const probabilities = softmax(output);
  return probabilities.indexOf(Math.max(...probabilities));
}

// Make a prediction with confidence scores
export function predictWithConfidence(
  input: number[],
  weights1: number[][],
  weights2: number[][],
  biases1: number[],
  biases2: number[]
): { prediction: number; confidence: number[] } {
  console.log('Starting prediction with input shape:', input.length);
  
  const { output } = forwardPass(input, weights1, weights2, biases1, biases2, false);
  const confidence = softmax(output);
  
  console.log('Confidence scores:', {
    raw: output,
    softmax: confidence,
    prediction: confidence.indexOf(Math.max(...confidence))
  });
  
  const prediction = confidence.indexOf(Math.max(...confidence));
  return { prediction, confidence };
}

// Evaluate model accuracy on a subset of data for faster feedback during training
export function evaluateAccuracyOnSubset(
  images: number[][],
  labels: number[],
  weights1: number[][],
  weights2: number[][],
  biases1: number[],
  biases2: number[],
  sampleSize: number = 500  // Reduced from 1000 to 500 for faster validation
): number {
  // Take a random sample of the test set
  const indices = new Set<number>();
  while (indices.size < sampleSize) {
    indices.add(Math.floor(Math.random() * images.length));
  }
  
  let correct = 0;
  let count = 0;
  indices.forEach(i => {
    const prediction = predictDigit(images[i], weights1, weights2, biases1, biases2);
    if (prediction === labels[i]) correct++;
    count++;
  });
  
  return correct / count;
}

// Train on a batch of data with L2 regularization
export function trainBatch(
  batchImages: number[][],
  batchLabels: number[],
  weights1: number[][],
  weights2: number[][],
  biases1: number[],
  biases2: number[],
  learningRate: number,
  l2Lambda: number = 0.0001  // Reduced regularization
): { weights1: number[][], weights2: number[][], biases1: number[], biases2: number[] } {
  const batchSize = batchImages.length;
  const inputSize = batchImages[0].length;
  const hiddenSize = weights1[0].length;
  const outputSize = weights2[0].length;

  let batchLoss = 0;

  // Initialize gradients
  const gradW1 = Array(inputSize).fill(0).map(() => Array(hiddenSize).fill(0));
  const gradW2 = Array(hiddenSize).fill(0).map(() => Array(outputSize).fill(0));
  const gradB1 = Array(hiddenSize).fill(0);
  const gradB2 = Array(outputSize).fill(0);

  // Process each image in the batch
  for (let i = 0; i < batchSize; i++) {
    const image = batchImages[i];
    const label = batchLabels[i];

    // Forward pass
    const hidden = new Array(hiddenSize);
    for (let j = 0; j < hiddenSize; j++) {
      let sum = biases1[j];
      for (let k = 0; k < inputSize; k++) {
        sum += image[k] * weights1[k][j];
      }
      hidden[j] = Math.max(0.01 * sum, sum); // LeakyReLU
    }

    const output = new Array(outputSize);
    let maxOutput = -Infinity;
    for (let j = 0; j < outputSize; j++) {
      let sum = biases2[j];
      for (let k = 0; k < hiddenSize; k++) {
        sum += hidden[k] * weights2[k][j];
      }
      output[j] = sum;
      maxOutput = Math.max(maxOutput, sum);
    }

    // Softmax
    let sumExp = 0;
    for (let j = 0; j < outputSize; j++) {
      output[j] = Math.exp(output[j] - maxOutput);
      sumExp += output[j];
    }
    for (let j = 0; j < outputSize; j++) {
      output[j] /= sumExp;
    }

    // Calculate loss
    batchLoss -= Math.log(output[label] + 1e-10);

    // Backward pass
    const outputError = new Array(outputSize);
    for (let j = 0; j < outputSize; j++) {
      outputError[j] = output[j] - (j === label ? 1 : 0);
    }

    // Hidden layer error
    const hiddenError = new Array(hiddenSize).fill(0);
    for (let j = 0; j < hiddenSize; j++) {
      for (let k = 0; k < outputSize; k++) {
        hiddenError[j] += outputError[k] * weights2[j][k];
      }
      hiddenError[j] *= hidden[j] > 0 ? 1 : 0.01; // LeakyReLU derivative
    }

    // Accumulate gradients
    for (let j = 0; j < hiddenSize; j++) {
      for (let k = 0; k < outputSize; k++) {
        gradW2[j][k] += hidden[j] * outputError[k];
      }
    }
    for (let j = 0; j < outputSize; j++) {
      gradB2[j] += outputError[j];
    }

    for (let j = 0; j < inputSize; j++) {
      for (let k = 0; k < hiddenSize; k++) {
        gradW1[j][k] += image[j] * hiddenError[k];
      }
    }
    for (let j = 0; j < hiddenSize; j++) {
      gradB1[j] += hiddenError[j];
    }
  }

  // Update weights and biases with momentum
  const scale = learningRate / batchSize;
  let totalWeightUpdate = 0;
  let maxWeightUpdate = 0;

  for (let i = 0; i < inputSize; i++) {
    for (let j = 0; j < hiddenSize; j++) {
      const update = scale * (gradW1[i][j] + l2Lambda * weights1[i][j]);
      weights1[i][j] -= update;
      totalWeightUpdate += Math.abs(update);
      maxWeightUpdate = Math.max(maxWeightUpdate, Math.abs(update));
    }
  }
  for (let i = 0; i < hiddenSize; i++) {
    for (let j = 0; j < outputSize; j++) {
      const update = scale * (gradW2[i][j] + l2Lambda * weights2[i][j]);
      weights2[i][j] -= update;
      totalWeightUpdate += Math.abs(update);
      maxWeightUpdate = Math.max(maxWeightUpdate, Math.abs(update));
    }
  }
  for (let i = 0; i < hiddenSize; i++) {
    biases1[i] -= scale * gradB1[i];
  }
  for (let i = 0; i < outputSize; i++) {
    biases2[i] -= scale * gradB2[i];
  }

  // Log batch statistics occasionally
  if (Math.random() < 0.1) { // Log ~10% of batches to avoid console spam
    console.log('Batch stats:', {
      batchSize,
      avgLoss: batchLoss / batchSize,
      avgWeightUpdate: totalWeightUpdate / (inputSize * hiddenSize + hiddenSize * outputSize),
      maxWeightUpdate
    });
  }

  return { weights1, weights2, biases1, biases2 };
}

// Evaluate model accuracy on a dataset
export function evaluateAccuracy(
  images: number[][],
  labels: number[],
  weights1: number[][],
  weights2: number[][],
  biases1: number[],
  biases2: number[]
): number {
  let correct = 0;
  for (let i = 0; i < images.length; i++) {
    const prediction = predictDigit(images[i], weights1, weights2, biases1, biases2);
    if (prediction === labels[i]) correct++;
  }
  return correct / images.length;
} 