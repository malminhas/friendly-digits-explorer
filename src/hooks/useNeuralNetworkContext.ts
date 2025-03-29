
import { useContext } from 'react';
import { NeuralNetworkContext } from '@/context/NeuralNetworkContext';

export const useNeuralNetwork = () => {
  const context = useContext(NeuralNetworkContext);
  if (!context) {
    throw new Error('useNeuralNetwork must be used within a NeuralNetworkProvider');
  }
  return context;
};
