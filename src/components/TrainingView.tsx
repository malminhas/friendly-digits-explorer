
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import NeuralNetworkVisualization from '@/components/NeuralNetworkVisualization';
import { useNeuralNetwork } from '@/context/NeuralNetworkContext';
import { Play, Pause, RefreshCw } from 'lucide-react';

interface TrainingViewProps {
  onTrainingComplete: () => void;
}

const TrainingView = ({ onTrainingComplete }: TrainingViewProps) => {
  const { trainModel, datasetLoaded, isTraining } = useNeuralNetwork();
  const [epochs, setEpochs] = useState(5);
  const [learningRate, setLearningRate] = useState(0.1);
  const [batchSize, setBatchSize] = useState(32);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [showWeights, setShowWeights] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [trainingComplete, setTrainingComplete] = useState(false);

  const handleStartTraining = async () => {
    setCurrentEpoch(0);
    setAccuracy(0);
    setProgress(0);
    setTrainingComplete(false);
    setIsPaused(false);

    try {
      await trainModel(epochs, learningRate, batchSize, (epoch, acc) => {
        setCurrentEpoch(epoch);
        setAccuracy(acc);
        setProgress((epoch / epochs) * 100);
      });
      
      setTrainingComplete(true);
      onTrainingComplete();
    } catch (error) {
      console.error('Training error:', error);
    }
  };

  const handleResetTraining = () => {
    setCurrentEpoch(0);
    setAccuracy(0);
    setProgress(0);
    setTrainingComplete(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    // In a real implementation, we would pause the training process
    // For this demo, we'll keep it simple
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Train Your Neural Network</h2>
        <p className="text-muted-foreground">
          This is a simplified 3-layer neural network with 784 input nodes (one for each pixel),
          128 nodes in the hidden layer, and 10 output nodes (one for each digit).
          Watch the connections change as the model learns!
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-medium">Network Architecture</h3>
            
            <div className="h-[400px] relative overflow-hidden">
              <NeuralNetworkVisualization 
                inputLayer={784}
                hiddenLayer={128}
                outputLayer={10}
                showWeights={showWeights}
                width={500}
                height={400}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowWeights(!showWeights)}
                className="text-sm"
              >
                {showWeights ? 'Hide Weights' : 'Show Weights'}
              </Button>
              
              <div className="text-sm text-muted-foreground italic">
                {showWeights 
                  ? 'Blue lines represent positive weights, red lines represent negative weights' 
                  : 'Click to show connection weights'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full lg:w-80">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Training Parameters</h3>
              
              <div className="space-y-2">
                <Label htmlFor="epochs">Epochs: {epochs}</Label>
                <Slider
                  id="epochs"
                  min={1}
                  max={100}
                  step={1}
                  value={[epochs]}
                  onValueChange={(value) => setEpochs(value[0])}
                  disabled={isTraining}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="learning-rate">Learning Rate: {learningRate}</Label>
                <Slider
                  id="learning-rate"
                  min={0.001}
                  max={0.5}
                  step={0.001}
                  value={[learningRate]}
                  onValueChange={(value) => setLearningRate(value[0])}
                  disabled={isTraining}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-size">Batch Size: {batchSize}</Label>
                <Slider
                  id="batch-size"
                  min={1}
                  max={128}
                  step={1}
                  value={[batchSize]}
                  onValueChange={(value) => setBatchSize(value[0])}
                  disabled={isTraining}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-medium">Training Progress</h3>
              
              {isTraining && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Epoch {currentEpoch}/{epochs}</span>
                    <span>Accuracy: {(accuracy * 100).toFixed(2)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              {!isTraining && !trainingComplete && (
                <p className="text-sm text-muted-foreground">
                  Click Start Training to begin the process.
                </p>
              )}
              
              {trainingComplete && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Training Complete!
                  </div>
                  <div className="text-sm">
                    Final Accuracy: {(accuracy * 100).toFixed(2)}%
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                {!isTraining && !trainingComplete && (
                  <Button 
                    onClick={handleStartTraining} 
                    disabled={!datasetLoaded}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Training
                  </Button>
                )}
                
                {isTraining && (
                  <>
                    <Button 
                      onClick={togglePause} 
                      variant="outline" 
                      className="flex-1"
                    >
                      {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                  </>
                )}
                
                {trainingComplete && (
                  <Button 
                    onClick={handleResetTraining} 
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingView;
