
export interface NeuralNetworkContextType {
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
