
// Neural network implementation for MNIST digit classification

// Activation function
export const sigmoid = (x: number): number => {
  return 1 / (1 + Math.exp(-x));
};

// Initialize the neural network weights and biases
export const initializeModel = (): {
  weights1: number[][];
  weights2: number[][];
  biases1: number[];
  biases2: number[];
} => {
  // Input layer: 784 nodes (28x28 pixels)
  // Hidden layer: 128 nodes
  // Output layer: 10 nodes (digits 0-9)
  
  // Initialize weights with small random values
  const weights1: number[][] = [];
  for (let i = 0; i < 784; i++) {
    weights1.push(Array(128).fill(0).map(() => (Math.random() - 0.5) * 0.1));
  }
  
  const weights2: number[][] = [];
  for (let i = 0; i < 128; i++) {
    weights2.push(Array(10).fill(0).map(() => (Math.random() - 0.5) * 0.1));
  }

  // Initialize biases with zeros
  const biases1 = Array(128).fill(0);
  const biases2 = Array(10).fill(0);

  return { weights1, weights2, biases1, biases2 };
};

// Forward pass through the network
export const forward = (
  input: number[], 
  weights1: number[][], 
  weights2: number[][], 
  biases1: number[], 
  biases2: number[]
): [number[], number[]] => {
  // Calculate hidden layer activations
  const hidden = Array(128).fill(0);
  for (let j = 0; j < 128; j++) {
    let sum = biases1[j];
    for (let i = 0; i < 784; i++) {
      sum += input[i] * weights1[i][j];
    }
    hidden[j] = sigmoid(sum);
  }

  // Calculate output layer activations
  const output = Array(10).fill(0);
  for (let k = 0; k < 10; k++) {
    let sum = biases2[k];
    for (let j = 0; j < 128; j++) {
      sum += hidden[j] * weights2[j][k];
    }
    output[k] = sigmoid(sum);
  }

  return [hidden, output];
};

// Make a prediction (find the index of the highest output value)
export const predict = (
  input: number[],
  weights1: number[][],
  weights2: number[][],
  biases1: number[],
  biases2: number[]
): number => {
  try {
    const [_, output] = forward(input, weights1, weights2, biases1, biases2);
    return output.indexOf(Math.max(...output));
  } catch (error) {
    console.error("Prediction error:", error);
    return -1;
  }
};

// Train the neural network with backpropagation
export const trainBatch = (
  batchImages: number[][],
  batchLabels: number[],
  weights1: number[][],
  weights2: number[][],
  biases1: number[],
  biases2: number[],
  learningRate: number
): void => {
  const batchSize = batchImages.length;
  
  // Accumulate gradients over the batch
  const dw1: number[][] = Array(784).fill(0).map(() => Array(128).fill(0));
  const dw2: number[][] = Array(128).fill(0).map(() => Array(10).fill(0));
  const db1: number[] = Array(128).fill(0);
  const db2: number[] = Array(10).fill(0);

  for (let i = 0; i < batchSize; i++) {
    const input = batchImages[i];
    const label = batchLabels[i];

    // Forward pass
    const [hidden, output] = forward(input, weights1, weights2, biases1, biases2);

    // Calculate output layer error
    const outputError = Array(10).fill(0);
    for (let k = 0; k < 10; k++) {
      const target = k === label ? 1 : 0;
      outputError[k] = output[k] * (1 - output[k]) * (target - output[k]);
    }

    // Calculate hidden layer error
    const hiddenError = Array(128).fill(0);
    for (let j = 0; j < 128; j++) {
      let error = 0;
      for (let k = 0; k < 10; k++) {
        error += outputError[k] * weights2[j][k];
      }
      hiddenError[j] = hidden[j] * (1 - hidden[j]) * error;
    }

    // Accumulate gradients for weights and biases
    for (let j = 0; j < 128; j++) {
      db1[j] += hiddenError[j];
      for (let i = 0; i < 784; i++) {
        dw1[i][j] += input[i] * hiddenError[j];
      }
      
      for (let k = 0; k < 10; k++) {
        dw2[j][k] += hidden[j] * outputError[k];
      }
    }

    for (let k = 0; k < 10; k++) {
      db2[k] += outputError[k];
    }
  }

  // Update weights and biases with accumulated gradients
  for (let i = 0; i < 784; i++) {
    for (let j = 0; j < 128; j++) {
      weights1[i][j] += learningRate * dw1[i][j] / batchSize;
    }
  }

  for (let j = 0; j < 128; j++) {
    biases1[j] += learningRate * db1[j] / batchSize;
    for (let k = 0; k < 10; k++) {
      weights2[j][k] += learningRate * dw2[j][k] / batchSize;
    }
  }

  for (let k = 0; k < 10; k++) {
    biases2[k] += learningRate * db2[k] / batchSize;
  }
};

// Evaluate model accuracy on test data
export const evaluateAccuracy = (
  testImages: number[][],
  testLabels: number[],
  weights1: number[][],
  weights2: number[][],
  biases1: number[],
  biases2: number[]
): number => {
  let correct = 0;
  for (let i = 0; i < testImages.length; i++) {
    const prediction = predict(testImages[i], weights1, weights2, biases1, biases2);
    if (prediction === testLabels[i]) {
      correct++;
    }
  }
  return correct / testImages.length;
};
