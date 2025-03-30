import { useEffect, useState } from 'react';
import { useNeuralNetwork } from '@/context/NeuralNetworkContext';
import { Card } from './ui/card';

type ConfusionMatrixData = number[][];

export default function ConfusionMatrix() {
  const { testImages, testLabels, predict, modelMetadata } = useNeuralNetwork();
  const [matrix, setMatrix] = useState<ConfusionMatrixData>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    calculateConfusionMatrix();
  }, [testImages, testLabels]);

  const calculateConfusionMatrix = async () => {
    if (!testImages || !testLabels || testImages.length === 0) return;

    setIsCalculating(true);
    
    // Initialize 10x10 matrix with zeros
    const confusionMatrix: number[][] = Array(10).fill(0).map(() => Array(10).fill(0));
    
    // Calculate confusion matrix
    for (let i = 0; i < testImages.length; i++) {
      const prediction = predict(testImages[i]);
      const actual = testLabels[i];
      confusionMatrix[actual][prediction]++;
    }

    setMatrix(confusionMatrix);
    setIsCalculating(false);
  };

  if (isCalculating) {
    return <div>Calculating confusion matrix...</div>;
  }

  const getColor = (value: number, max: number) => {
    // Convert to grayscale where higher values are darker
    const intensity = Math.floor(255 * (1 - (value / max)));
    return `rgb(${intensity}, ${intensity}, ${intensity})`;
  };

  const maxValue = Math.max(...matrix.flat());

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Confusion Matrix Analysis</h3>
            {modelMetadata && (
              <div className="mt-2 bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="font-medium">Using Saved Model</div>
                  <div className="bg-purple-500 text-white text-sm px-2 py-0.5 rounded">
                    Accuracy: {(modelMetadata.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Trained on {new Date(modelMetadata.trainedAt).toLocaleDateString()} using {modelMetadata.epochs} epochs, learning rate {modelMetadata.learningRate}, batch size {modelMetadata.batchSize}, {modelMetadata.hiddenNodes} hidden nodes
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600">
            A confusion matrix shows how well the model performs on each digit. Each cell shows the number of times 
            the model predicted a digit (columns) for each actual digit (rows). The diagonal represents correct predictions.
            Darker colors indicate higher numbers.
          </p>
        
          <div className="flex gap-8">
            <div className="space-y-4">
              <div className="relative pl-12">
                <div className="absolute -left-6 top-1/2 -rotate-90 transform text-sm text-gray-500 whitespace-nowrap">
                  Actual Digit
                </div>
                <div className="grid grid-cols-[auto_repeat(10,minmax(0,1fr))] gap-1">
                  <div className=""></div>
                  {Array(10).fill(0).map((_, i) => (
                    <div key={i} className="text-center text-sm font-medium">
                      {i}
                    </div>
                  ))}
                  {matrix.map((row, i) => (
                    <>
                      <div key={`label-${i}`} className="text-sm font-medium text-right pr-2 w-8">
                        {i}
                      </div>
                      {row.map((value, j) => (
                        <div
                          key={`${i}-${j}`}
                          className="aspect-square flex items-center justify-center text-xs"
                          style={{
                            backgroundColor: getColor(value, maxValue),
                            color: value > maxValue / 2 ? 'white' : 'black',
                          }}
                        >
                          {value}
                        </div>
                      ))}
                    </>
                  ))}
                </div>
                <div className="text-center text-sm text-gray-500 mt-4">
                  Predicted Digit
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">How to Read the Matrix</h4>
              <ul className="text-sm space-y-2">
                <li>• <strong>Rows</strong> show the actual digit (0-9)</li>
                <li>• <strong>Columns</strong> show what the model predicted</li>
                <li>• <strong>Diagonal</strong> (top-left to bottom-right) shows correct predictions</li>
                <li>• <strong>Off-diagonal</strong> cells show mistakes</li>
                <li>• <strong>Darker colors</strong> indicate more predictions in that category</li>
              </ul>
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Common Patterns:</strong>
                </p>
                <ul className="space-y-1">
                  <li>• High numbers on the diagonal indicate good performance</li>
                  <li>• Dark off-diagonal cells show common mistakes</li>
                  <li>• Similar-looking digits (like 4/9 or 3/8) often get confused</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 