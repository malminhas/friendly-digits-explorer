
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadMnistData } from '@/lib/mnist';

interface NeuralNetworkContextType {
  trainImages: number[][];
  trainLabels: number[];
  testImages: number[][];
  testLabels: number[];
  weights1: number[][] | null;
  weights2: number[][] | null;
  biases1: number[] | null;
  biases2: number[] | null;
  datasetLoaded: boolean;
  loadDataset: () => Promise<void>;
  trainModel: (epochs: number, learningRate: number, batchSize: number, 
               onEpochComplete: (epoch: number, accuracy: number) => void) => Promise<void>;
  predict: (inputImage: number[]) => number;
  isTraining: boolean;
}

const NeuralNetworkContext = createContext<NeuralNetworkContextType | null>(null);

export const NeuralNetworkProvider = ({ children }: { children: ReactNode }) => {
  const [trainImages, setTrainImages] = useState<number[][]>([]);
  const [trainLabels, setTrainLabels] = useState<number[]>([]);
  const [testImages, setTestImages] = useState<number[][]>([]);
  const [testLabels, setTestLabels] = useState<number[]>([]);
  const [weights1, setWeights1] = useState<number[][] | null>(null);
  const [weights2, setWeights2] = useState<number[][] | null>(null);
  const [biases1, setBiases1] = useState<number[] | null>(null);
  const [biases2, setBiases2] = useState<number[] | null>(null);
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  // Initialize the neural network
  const initializeModel = () => {
    // Input layer: 784 nodes (28x28 pixels)
    // Hidden layer: 128 nodes
    // Output layer: 10 nodes (digits 0-9)
    
    // Initialize weights with small random values
    const w1: number[][] = [];
    for (let i = 0; i < 784; i++) {
      w1.push(Array(128).fill(0).map(() => (Math.random() - 0.5) * 0.1));
    }
    
    const w2: number[][] = [];
    for (let i = 0; i < 128; i++) {
      w2.push(Array(10).fill(0).map(() => (Math.random() - 0.5) * 0.1));
    }

    // Initialize biases with zeros
    const b1 = Array(128).fill(0);
    const b2 = Array(10).fill(0);

    setWeights1(w1);
    setWeights2(w2);
    setBiases1(b1);
    setBiases2(b2);
  };

  const loadDataset = async () => {
    try {
      const { trainImages, trainLabels, testImages, testLabels } = await loadMnistData();
      
      setTrainImages(trainImages);
      setTrainLabels(trainLabels);
      setTestImages(testImages);
      setTestLabels(testLabels);
      setDatasetLoaded(true);
      
      // Initialize model when data is loaded
      initializeModel();
    } catch (error) {
      console.error("Failed to load MNIST dataset:", error);
    }
  };

  // Sigmoid activation function
  const sigmoid = (x: number): number => {
    return 1 / (1 + Math.exp(-x));
  };

  // Forward pass through the network
  const forward = (input: number[]): [number[], number[]] => {
    if (!weights1 || !weights2 || !biases1 || !biases2) {
      throw new Error("Model not initialized");
    }

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
  const predict = (input: number[]): number => {
    try {
      const [_, output] = forward(input);
      return output.indexOf(Math.max(...output));
    } catch (error) {
      console.error("Prediction error:", error);
      return -1;
    }
  };

  // Train the neural network
  const trainModel = async (
    epochs: number,
    learningRate: number,
    batchSize: number,
    onEpochComplete: (epoch: number, accuracy: number) => void
  ): Promise<void> => {
    if (!weights1 || !weights2 || !biases1 || !biases2 || trainImages.length === 0) {
      throw new Error("Model not initialized or dataset not loaded");
    }

    setIsTraining(true);

    try {
      for (let epoch = 0; epoch < epochs; epoch++) {
        // Shuffle the training data
        const indices = Array.from({ length: trainImages.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Process in batches
        for (let batchStart = 0; batchStart < trainImages.length; batchStart += batchSize) {
          const batchEnd = Math.min(batchStart + batchSize, trainImages.length);
          
          // Accumulate gradients over the batch
          const dw1: number[][] = Array(784).fill(0).map(() => Array(128).fill(0));
          const dw2: number[][] = Array(128).fill(0).map(() => Array(10).fill(0));
          const db1: number[] = Array(128).fill(0);
          const db2: number[] = Array(10).fill(0);

          for (let i = batchStart; i < batchEnd; i++) {
            const idx = indices[i];
            const input = trainImages[idx];
            const label = trainLabels[idx];

            // Forward pass
            const [hidden, output] = forward(input);

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
          const currentBatchSize = batchEnd - batchStart;
          for (let i = 0; i < 784; i++) {
            for (let j = 0; j < 128; j++) {
              weights1[i][j] += learningRate * dw1[i][j] / currentBatchSize;
            }
          }

          for (let j = 0; j < 128; j++) {
            biases1[j] += learningRate * db1[j] / currentBatchSize;
            for (let k = 0; k < 10; k++) {
              weights2[j][k] += learningRate * dw2[j][k] / currentBatchSize;
            }
          }

          for (let k = 0; k < 10; k++) {
            biases2[k] += learningRate * db2[k] / currentBatchSize;
          }

          // Allow UI to update by yielding to the event loop
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        // Evaluate on test data to get accuracy
        let correct = 0;
        for (let i = 0; i < testImages.length; i++) {
          const prediction = predict(testImages[i]);
          if (prediction === testLabels[i]) {
            correct++;
          }
        }
        const accuracy = correct / testImages.length;
        
        // Update state with new weights
        setWeights1([...weights1]);
        setWeights2([...weights2]);
        setBiases1([...biases1]);
        setBiases2([...biases2]);

        // Report progress
        onEpochComplete(epoch + 1, accuracy);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } finally {
      setIsTraining(false);
    }
  };

  useEffect(() => {
    loadDataset();
  }, []);

  const value = {
    trainImages,
    trainLabels,
    testImages,
    testLabels,
    weights1,
    weights2,
    biases1,
    biases2,
    datasetLoaded,
    loadDataset,
    trainModel,
    predict,
    isTraining
  };

  return (
    <NeuralNetworkContext.Provider value={value}>
      {children}
    </NeuralNetworkContext.Provider>
  );
};

export const useNeuralNetwork = () => {
  const context = useContext(NeuralNetworkContext);
  if (!context) {
    throw new Error('useNeuralNetwork must be used within a NeuralNetworkProvider');
  }
  return context;
};
