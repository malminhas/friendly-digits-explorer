import { useState } from 'react';
import { useNeuralNetwork } from '@/context/NeuralNetworkContext';
import NeuralNetworkVisualization from './NeuralNetworkVisualization';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface TrainingViewProps {
  onTrainingComplete?: () => void;
}

export default function TrainingView({ onTrainingComplete }: TrainingViewProps) {
  const { trainModel, isTraining, modelMetadata, weights1, weights2, biases1, biases2, exportModel } = useNeuralNetwork();
  const [epochs, setEpochs] = useState(30);
  const [learningRate, setLearningRate] = useState(0.05);
  const [batchSize, setBatchSize] = useState(16);
  const [hiddenNodes, setHiddenNodes] = useState(128);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);

  const handleStartTraining = async () => {
    try {
      setCurrentEpoch(0);
      setCurrentAccuracy(0);
      
      await trainModel(epochs, learningRate, batchSize, hiddenNodes, (epoch, accuracy) => {
        console.log(`Progress update - Epoch ${epoch}/${epochs}, Accuracy: ${(accuracy * 100).toFixed(2)}%`);
        setCurrentEpoch(epoch);
        setCurrentAccuracy(accuracy);
      });

      onTrainingComplete?.();
    } catch (error) {
      console.error('Training failed:', error);
      toast.error('Training failed. Please try again.');
    }
  };

  const handleExport = () => {
    try {
      const modelJson = exportModel();
      const blob = new Blob([modelJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mnist-model.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Model exported successfully!');
    } catch (error) {
      toast.error('Failed to export model. Please train the model first.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Train Your Neural Network</h2>
        <p className="text-gray-600">
          This is a simplified 3-layer neural network trained on a subset of 3,000 training images and 
          1,000 test images from the full MNIST dataset of 60,000 training images and 10,000 test images.
          The network has 784 input nodes (one for each pixel),{' '}
          {hiddenNodes} nodes in the hidden layer, and 10 output nodes (one for each digit).
          Watch the connections change as the model learns!
        </p>
      </div>

      {modelMetadata && (
        <Card className="p-4 bg-blue-50">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">Using Saved Model</h3>
              <Badge variant="secondary">
                Accuracy: {(modelMetadata.accuracy * 100).toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Trained on {modelMetadata.trainedAt.split('T')[0]} using 3,000 training images and 1,000 test images with:
              {' '}{modelMetadata.epochs} epochs,
              {' '}learning rate {modelMetadata.learningRate},
              {' '}batch size {modelMetadata.batchSize},
              {' '}{modelMetadata.hiddenNodes} hidden nodes
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Left side: Network Visualization */}
          <Card className="w-full">
            <div className="p-6">
              <div className="h-[600px] relative overflow-hidden">
                <NeuralNetworkVisualization
                  weights1={weights1}
                  weights2={weights2}
                  biases1={biases1}
                  biases2={biases2}
                  hiddenNodes={hiddenNodes}
                />
              </div>
            </div>
          </Card>

          {/* Right side: Controls */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Network Architecture</h3>
              <div>
                <label className="text-sm text-gray-600">Hidden Layer Nodes: {hiddenNodes}</label>
                <p className="text-xs text-gray-500 mb-2">Number of neurons in the hidden layer. More nodes increase the model's capacity to learn complex patterns but require more computation and may overfit.</p>
                <Slider
                  value={[hiddenNodes]}
                  onValueChange={(value) => setHiddenNodes(value[0])}
                  min={32}
                  max={256}
                  step={32}
                  className="mt-2"
                  disabled={isTraining}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Training Parameters</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Epochs: {epochs}</label>
                  <p className="text-xs text-gray-500 mb-2">Number of complete passes through the training data. More epochs can lead to better accuracy but may cause overfitting.</p>
                  <Slider
                    value={[epochs]}
                    onValueChange={(value) => setEpochs(value[0])}
                    min={5}
                    max={50}
                    step={5}
                    className="mt-2"
                    disabled={isTraining}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Learning Rate: {learningRate}</label>
                  <p className="text-xs text-gray-500 mb-2">Controls how much the model adjusts its weights. Higher values learn faster but may be unstable, lower values learn slower but more reliably.</p>
                  <Slider
                    value={[learningRate]}
                    onValueChange={(value) => setLearningRate(value[0])}
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    className="mt-2"
                    disabled={isTraining}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Batch Size: {batchSize}</label>
                  <p className="text-xs text-gray-500 mb-2">Number of training examples processed together. Larger batches are more stable but use more memory, smaller batches add more randomness.</p>
                  <Slider
                    value={[batchSize]}
                    onValueChange={(value) => setBatchSize(value[0])}
                    min={16}
                    max={128}
                    step={16}
                    className="mt-2"
                    disabled={isTraining}
                  />
                </div>
              </div>
            </div>

            {isTraining && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Training Progress</span>
                  <span>
                    Epoch {currentEpoch}/{epochs} - Accuracy: {(currentAccuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={(currentEpoch / epochs) * 100} className="bg-gray-100 [&>div]:bg-green-600" />
                <p className="text-xs text-gray-500">
                  Training with batch size {batchSize}. This may take a few minutes...
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={handleStartTraining}
                disabled={isTraining}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isTraining ? 'Training...' : 'Start Training'}
              </Button>
              <Button
                onClick={handleExport}
                disabled={isTraining || !modelMetadata}
                variant="outline"
              >
                Export Model
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-xl font-medium mb-4">How Neural Networks Learn</h3>
          
          <div className="space-y-4 text-sm">
            <p>
              <strong>Learning process:</strong> When training a neural network, it adjusts the weights 
              of connections between neurons based on how wrong its predictions are.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Forward Pass</h4>
                <p>Input data is passed through the network, with each connection multiplying the data by its weight. 
                   The neural network makes a prediction based on the current weights.</p>
              </div>
              
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Error Calculation</h4>
                <p>The network compares its prediction with the correct answer and calculates the error. 
                   This tells us how wrong the network is.</p>
              </div>
              
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Backward Pass</h4>
                <p>The network updates all weights based on their contribution to the error. 
                   Connections that lead to wrong answers are weakened, while useful connections are strengthened.</p>
              </div>
            </div>
            
            <p>
              <strong>What you're seeing:</strong> In the visualization, blue connections represent positive weights 
              (they increase the activation of the next neuron), while red connections represent negative weights 
              (they decrease activation). The thickness of the line represents the strength of the connection.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
