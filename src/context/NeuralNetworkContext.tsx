
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { loadMnistData } from '@/lib/mnist';
import { NeuralNetworkContextType } from '@/types/neuralNetwork';
import { initializeModel, predict as predictDigit, trainBatch, evaluateAccuracy } from '@/services/neuralNetwork';

export const NeuralNetworkContext = createContext<NeuralNetworkContextType | null>(null);

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

  const loadDataset = async () => {
    try {
      const { trainImages, trainLabels, testImages, testLabels } = await loadMnistData();
      
      setTrainImages(trainImages);
      setTrainLabels(trainLabels);
      setTestImages(testImages);
      setTestLabels(testLabels);
      setDatasetLoaded(true);
      
      // Initialize model when data is loaded
      const { weights1, weights2, biases1, biases2 } = initializeModel();
      setWeights1(weights1);
      setWeights2(weights2);
      setBiases1(biases1);
      setBiases2(biases2);
    } catch (error) {
      console.error("Failed to load MNIST dataset:", error);
    }
  };

  // Make a prediction
  const predict = (input: number[]): number => {
    if (!weights1 || !weights2 || !biases1 || !biases2) {
      throw new Error("Model not initialized");
    }
    return predictDigit(input, weights1, weights2, biases1, biases2);
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
          
          // Prepare batch data
          const batchImages = [];
          const batchLabels = [];
          for (let i = batchStart; i < batchEnd; i++) {
            const idx = indices[i];
            batchImages.push(trainImages[idx]);
            batchLabels.push(trainLabels[idx]);
          }
          
          // Train on batch
          trainBatch(
            batchImages,
            batchLabels,
            weights1,
            weights2,
            biases1,
            biases2,
            learningRate
          );
          
          // Allow UI to update by yielding to the event loop
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        // Evaluate accuracy on test data
        const accuracy = evaluateAccuracy(
          testImages,
          testLabels,
          weights1,
          weights2,
          biases1,
          biases2
        );
        
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
