import { useState } from 'react';
import { useNeuralNetwork } from '@/context/NeuralNetworkContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MnistTestImages() {
  const { testImages, testLabels, predictWithConfidence } = useNeuralNetwork();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testImages.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testImages.length) % testImages.length);
  };

  const handleSliderChange = (value: number[]) => {
    setCurrentIndex(value[0]);
  };

  if (!testImages || testImages.length === 0) {
    return <div>Loading test images...</div>;
  }

  const currentImage = testImages[currentIndex];
  const actualDigit = testLabels[currentIndex];
  const { prediction, confidence } = predictWithConfidence(currentImage);

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">MNIST Test Image</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="absolute top-0 right-0 -mr-16 text-sm">
                Actual: {actualDigit}
              </div>
              <div className="border border-gray-200 w-[200px] h-[200px] flex items-center justify-center bg-white">
                <canvas
                  width={280}
                  height={280}
                  style={{ 
                    imageRendering: 'pixelated',
                    width: '200px',
                    height: '200px'
                  }}
                  ref={(canvas) => {
                    if (canvas && currentImage) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        // Clear canvas
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, 280, 280);
                        
                        // Create a temporary canvas for the 28x28 image
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = 28;
                        tempCanvas.height = 28;
                        const tempCtx = tempCanvas.getContext('2d');
                        
                        if (tempCtx) {
                          // Draw the 28x28 image
                          const imageData = tempCtx.createImageData(28, 28);
                          for (let i = 0; i < currentImage.length; i++) {
                            const value = Math.floor((1 - currentImage[i]) * 255);
                            imageData.data[i * 4] = value;
                            imageData.data[i * 4 + 1] = value;
                            imageData.data[i * 4 + 2] = value;
                            imageData.data[i * 4 + 3] = 255;
                          }
                          tempCtx.putImageData(imageData, 0, 0);
                          
                          // Scale up to 280x280 with better quality
                          ctx.imageSmoothingEnabled = false;
                          ctx.drawImage(tempCanvas, 0, 0, 280, 280);
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div className="w-full space-y-2">
              <Label>Navigate Test Images</Label>
              <div className="flex items-center gap-4">
                <Button onClick={handlePrevious} size="icon" variant="outline">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Slider
                  value={[currentIndex]}
                  min={0}
                  max={testImages.length - 1}
                  step={1}
                  onValueChange={handleSliderChange}
                  className="flex-1"
                />
                <Button onClick={handleNext} size="icon" variant="outline">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Image {currentIndex + 1} of {testImages.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Prediction Result</h3>
          {prediction !== null && (
            <div className="flex flex-col items-center justify-center h-[200px] space-y-2">
              <div className={`w-24 h-24 rounded-full ${prediction === actualDigit ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center text-white text-4xl font-bold`}>
                {prediction}
              </div>
              <div className="text-sm text-gray-600">
                Confidence: {(confidence[prediction] * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Prediction Breakdown</h3>
          <div className="space-y-2">
            {confidence.map((conf, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 text-right font-medium ${i === prediction ? (prediction === actualDigit ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground'}`}>
                  {i}
                </div>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${i === prediction ? (prediction === actualDigit ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-300'}`}
                    style={{ width: `${conf * 100}%` }}
                  />
                </div>
                <div className={`w-16 text-right text-sm ${i === prediction ? (prediction === actualDigit ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground'}`}>
                  {(conf * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
} 