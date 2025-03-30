import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadMnistData } from '@/lib/mnist';
import { 
  initializeModel,
  predictDigit,
  predictWithConfidence,
  trainBatch,
  evaluateAccuracy,
  evaluateAccuracyOnSubset
} from '@/lib/neural-network';

// Types for model metadata
export type ModelMetadata = {
  epochs: number;
  learningRate: number;
  batchSize: number;
  hiddenNodes: number;
  trainedAt: string;
  accuracy: number;
};

export type SavedModel = {
  weights1: number[][];
  weights2: number[][];
  biases1: number[];
  biases2: number[];
  metadata: ModelMetadata;
};

// Constants for localStorage keys
const STORAGE_KEYS = {
  MODEL: 'mnist_model',
  TRAINED: 'mnist_trained'
};

// Helper functions for model persistence
const saveModelToStorage = (
  weights1: number[][],
  weights2: number[][],
  biases1: number[],
  biases2: number[],
  metadata: ModelMetadata
) => {
  try {
    const modelData: SavedModel = {
      weights1,
      weights2,
      biases1,
      biases2,
      metadata
    };
    
    console.log('Saving model to storage:', {
      modelId: new Date().toISOString(),
      metadata,
      weightsShape: {
        weights1: [weights1.length, weights1[0].length],
        weights2: [weights2.length, weights2[0].length]
      },
      sampleWeights: {
        weights1_sample: weights1[0].slice(0, 3),
        weights2_sample: weights2[0].slice(0, 3)
      }
    });
    
    localStorage.setItem(STORAGE_KEYS.MODEL, JSON.stringify(modelData));
    localStorage.setItem(STORAGE_KEYS.TRAINED, 'true');
  } catch (error) {
    console.error('Failed to save model to localStorage:', error);
  }
};

const loadModelFromStorage = () => {
  try {
    const trained = localStorage.getItem(STORAGE_KEYS.TRAINED) === 'true';
    if (!trained) {
      console.log('No trained model found in storage');
      return null;
    }

    const modelData = JSON.parse(localStorage.getItem(STORAGE_KEYS.MODEL) || '');
    console.log('Loaded model from storage:', {
      metadata: modelData.metadata,
      weightsShape: {
        weights1: [modelData.weights1.length, modelData.weights1[0].length],
        weights2: [modelData.weights2.length, modelData.weights2[0].length]
      },
      sampleWeights: {
        weights1_sample: modelData.weights1[0].slice(0, 3),
        weights2_sample: modelData.weights2[0].slice(0, 3)
      }
    });
    
    return modelData as SavedModel;
  } catch (error) {
    console.error('Failed to load model from localStorage:', error);
    return null;
  }
};

export type NeuralNetworkContextType = {
  trainImages: number[][];
  trainLabels: number[];
  testImages: number[][];
  testLabels: number[];
  weights1: number[][] | null;
  weights2: number[][] | null;
  biases1: number[] | null;
  biases2: number[] | null;
  datasetLoaded: boolean;
  isTraining: boolean;
  modelMetadata: ModelMetadata | null;
  loadDataset: () => Promise<void>;
  predict: (input: number[]) => number;
  predictWithConfidence: (input: number[]) => { prediction: number; confidence: number[] };
  trainModel: (epochs: number, learningRate: number, batchSize: number, hiddenNodes: number, onProgress: (epoch: number, accuracy: number) => void) => Promise<void>;
  exportModel: () => string;
};

export const NeuralNetworkContext = createContext<NeuralNetworkContextType | null>(null);

export const useNeuralNetwork = () => {
  const context = useContext(NeuralNetworkContext);
  if (!context) {
    throw new Error('useNeuralNetwork must be used within a NeuralNetworkProvider');
  }
  return context;
};

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
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(null);

  const loadDataset = async () => {
    try {
      const { trainImages, trainLabels, testImages, testLabels } = await loadMnistData();
      
      setTrainImages(trainImages);
      setTrainLabels(trainLabels);
      setTestImages(testImages);
      setTestLabels(testLabels);
      setDatasetLoaded(true);
      
      // Try to load saved model first
      const savedModel = loadModelFromStorage();
      if (savedModel) {
        const { weights1, weights2, biases1, biases2, metadata } = savedModel;
        setWeights1(weights1);
        setWeights2(weights2);
        setBiases1(biases1);
        setBiases2(biases2);
        setModelMetadata(metadata);
      } else {
        // Initialize new model if no saved model exists
        const { weights1, weights2, biases1, biases2 } = initializeModel(128); // Default to 128 hidden nodes
        setWeights1(weights1);
        setWeights2(weights2);
        setBiases1(biases1);
        setBiases2(biases2);
        setModelMetadata(null);
      }
    } catch (error) {
      console.error("Failed to load MNIST dataset:", error);
    }
  };

  // Make a prediction
  const predict = (input: number[]): number => {
    if (!weights1 || !weights2 || !biases1 || !biases2) {
      throw new Error("Model not initialized");
    }
    console.log('Making prediction with model:', {
      metadata: modelMetadata,
      weightsShape: {
        weights1: [weights1.length, weights1[0].length],
        weights2: [weights2.length, weights2[0].length]
      },
      sampleWeights: {
        weights1_sample: weights1[0].slice(0, 3),
        weights2_sample: weights2[0].slice(0, 3)
      }
    });
    return predictDigit(input, weights1, weights2, biases1, biases2);
  };

  const getConfidence = (input: number[]) => {
    if (!weights1 || !weights2 || !biases1 || !biases2) {
      throw new Error("Model not initialized");
    }
    console.log('Getting confidence with model:', {
      metadata: modelMetadata,
      weightsShape: {
        weights1: [weights1.length, weights1[0].length],
        weights2: [weights2.length, weights2[0].length]
      },
      sampleWeights: {
        weights1_sample: weights1[0].slice(0, 3),
        weights2_sample: weights2[0].slice(0, 3)
      }
    });
    return predictWithConfidence(input, weights1, weights2, biases1, biases2);
  };

  const trainModel = async (
    epochs: number,
    learningRate: number,
    batchSize: number,
    hiddenNodes: number,
    onProgress: (epoch: number, accuracy: number) => void
  ): Promise<void> => {
    try {
      setIsTraining(true);  // Set training state at start
      console.log('Starting training with parameters:', {
        epochs,
        learningRate,
        batchSize,
        hiddenNodes
      });

      // Initialize network
      const { weights1, weights2, biases1, biases2 } = initializeModel(hiddenNodes);
      console.log('Model initialized');

      // Load MNIST data
      console.log('Loading MNIST data...');
      const { trainImages, trainLabels, testImages, testLabels } = await loadMnistData();
      console.log('Data loaded:', {
        trainImages: trainImages.length,
        testImages: testImages.length
      });
      
      // Shuffle training data
      const indices = Array.from({ length: trainImages.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      // Training loop
      console.log('Starting training loop...');
      for (let epoch = 0; epoch < epochs; epoch++) {
        console.time(`Epoch ${epoch + 1}`);
        let epochLoss = 0;
        
        // Process batches
        for (let i = 0; i < trainImages.length; i += batchSize) {
          const batchIndices = indices.slice(i, Math.min(i + batchSize, trainImages.length));
          const batchImages = batchIndices.map(idx => trainImages[idx]);
          const batchLabels = batchIndices.map(idx => trainLabels[idx]);

          // Train batch
          const result = trainBatch(
            batchImages,
            batchLabels,
            weights1,
            weights2,
            biases1,
            biases2,
            learningRate
          );

          // Update weights
          Object.assign(weights1, result.weights1);
          Object.assign(weights2, result.weights2);
          Object.assign(biases1, result.biases1);
          Object.assign(biases2, result.biases2);
        }

        // Evaluate on subset of test set
        const accuracy = evaluateAccuracyOnSubset(
          testImages,
          testLabels,
          weights1,
          weights2,
          biases1,
          biases2
        );

        console.timeEnd(`Epoch ${epoch + 1}`);
        console.log(`Epoch ${epoch + 1}/${epochs} - Accuracy: ${(accuracy * 100).toFixed(2)}%`);

        // Update state and UI
        setWeights1(weights1);
        setWeights2(weights2);
        setBiases1(biases1);
        setBiases2(biases2);
        
        // Force UI update with a small delay
        await new Promise(resolve => setTimeout(resolve, 50));
        onProgress(epoch + 1, accuracy);
      }

      // Final evaluation on full test set
      console.log('Performing final evaluation...');
      const finalAccuracy = evaluateAccuracy(
        testImages,
        testLabels,
        weights1,
        weights2,
        biases1,
        biases2
      );
      console.log('Training completed. Final accuracy:', (finalAccuracy * 100).toFixed(2) + '%');

      // Save model
      const metadata: ModelMetadata = {
        accuracy: finalAccuracy,
        epochs,
        learningRate,
        batchSize,
        hiddenNodes,
        trainedAt: new Date().toISOString()
      };
      
      // Use the saveModelToStorage helper function
      saveModelToStorage(weights1, weights2, biases1, biases2, metadata);
      setModelMetadata(metadata);
      console.log('Model saved to localStorage');
    } catch (error) {
      console.error('Training failed:', error);
      throw error;
    } finally {
      setIsTraining(false);  // Reset training state when done
    }
  };

  const exportModel = (): string => {
    if (!weights1 || !weights2 || !biases1 || !biases2 || !modelMetadata) {
      throw new Error("No trained model available to export");
    }

    const modelData: SavedModel = {
      weights1,
      weights2,
      biases1,
      biases2,
      metadata: modelMetadata
    };

    return JSON.stringify(modelData, null, 2);
  };

  useEffect(() => {
    loadDataset();
  }, []);

  return (
    <NeuralNetworkContext.Provider value={{
      trainImages,
      trainLabels,
      testImages,
      testLabels,
      weights1,
      weights2,
      biases1,
      biases2,
      datasetLoaded,
      isTraining,
      modelMetadata,
      loadDataset,
      predict,
      predictWithConfidence: getConfidence,
      trainModel,
      exportModel
    }}>
      {children}
    </NeuralNetworkContext.Provider>
  );
};
