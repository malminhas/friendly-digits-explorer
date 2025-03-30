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
          Training is performed entirely in JavaScript on your CPU, making it accessible but slower than GPU-accelerated frameworks like TensorFlow or PyTorch.
        </p>
      </div>

      {modelMetadata && (
        <Card className="p-4 bg-blue-50">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">Saved Model</h3>
              <Badge variant="secondary">
                Accuracy: {(modelMetadata.accuracy * 100).toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Trained on {modelMetadata.trainedAt.split('T')[0]} using 3,000 training images and 1,000 test images with:
              {' '}{modelMetadata.epochs} epochs,
              {' '}learning rate {modelMetadata.learningRate},
              {' '}batch size {modelMetadata.batchSize},
              {' '}{modelMetadata.hiddenNodes} hidden nodes.
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
                  Training with batch size {batchSize}. This may take a few minutes since computation is done on CPU...
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
            <p className="text-muted-foreground">
              <strong>Learning process:</strong> Training a neural network involves iteratively adjusting the <strong>weights</strong> and <strong>biases</strong> of connections between neurons to minimize prediction errors. This implementation uses the <strong>backpropagation algorithm</strong> with <strong>stochastic gradient descent</strong>, running entirely in JavaScript on your CPU.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2 text-foreground">Forward Pass</h4>
                <p className="text-muted-foreground">Each training image (<strong>784 pixels</strong>) is fed through the network. Each neuron computes a weighted sum of its 
                   inputs, applies an <strong>activation function</strong>, and passes the result to the next layer.</p>
              </div>
              
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2 text-foreground">Error Calculation</h4>
                <p className="text-muted-foreground">The network compares its prediction with the <strong>true label</strong> using <strong>cross-entropy loss</strong>. 
                   This measures how far off the prediction is from the correct answer, like a score of how well the network is doing.</p>
              </div>
              
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2 text-foreground">Backward Pass</h4>
                <p className="text-muted-foreground">The error is sent backwards through the network to update the weights. Each connection is adjusted based on how much it 
                   contributed to the mistake, using the <strong>learning rate</strong> to control how big these adjustments are.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2 text-foreground">ReLU Activation</h4>
                <p className="text-muted-foreground">Think of <strong>ReLU</strong> (Rectified Linear Unit) as a simple on/off switch with dimming capabilities. When a neuron receives 
                   positive input, it passes that value through unchanged (like a dimmer). When the input is negative, it turns off completely (outputs zero). 
                   This simple behavior helps the network learn to recognize important patterns in the digits while ignoring irrelevant information.</p>
              </div>
              
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2 text-foreground">Softmax Output</h4>
                <p className="text-muted-foreground">The <strong>softmax function</strong> works like a voting system for digit recognition. It takes the network's raw scores for each digit 
                   and converts them into percentages that add up to 100%. The digit with the highest percentage becomes the network's guess, and that 
                   percentage tells us how confident the network is about its answer.</p>
              </div>
            </div>
            
            <p className="text-muted-foreground">
              <strong>What you're seeing:</strong> The visualization shows how neurons are connected in the network. <strong>Blue lines</strong> show 
              positive connections (encouraging recognition), while <strong>red lines</strong> show negative connections (discouraging recognition). 
              Thicker lines mean stronger connections. Watch how these connections change as the network learns to recognize different digit features!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
