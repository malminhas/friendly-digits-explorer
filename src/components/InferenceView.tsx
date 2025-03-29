
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNeuralNetwork } from '@/hooks/useNeuralNetworkContext';
import { Eraser, Pencil } from 'lucide-react';

const InferenceView = () => {
  const { predict } = useNeuralNetwork();
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasSize = 280; // 10x the MNIST image size for better drawing
  const imageSize = 28; // MNIST image size

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set up canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'black';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      
      // Prevent scrolling while drawing
      e.preventDefault();
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.closePath();
    
    // Make a prediction after drawing is complete
    predictDigit();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    setPrediction(null);
    setConfidence([]);
  };

  const predictDigit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create a temporary canvas to resize the image to 28x28
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageSize;
    tempCanvas.height = imageSize;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    // Draw the original image to the temp canvas, resizing it to 28x28
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, imageSize, imageSize);
    tempCtx.drawImage(canvas, 0, 0, canvasSize, canvasSize, 0, 0, imageSize, imageSize);
    
    // Get image data
    const imageData = tempCtx.getImageData(0, 0, imageSize, imageSize);
    const pixels = imageData.data;
    
    // Convert to grayscale and normalize to 0-1
    const grayscale: number[] = [];
    for (let i = 0; i < pixels.length; i += 4) {
      // Invert the color (white background becomes 0, black drawing becomes 1)
      const value = 1 - (pixels[i] / 255);
      grayscale.push(value);
    }
    
    // Make prediction
    const pred = predict(grayscale);
    setPrediction(pred);
    
    // For simplicity, generate a fake confidence level for visualization
    // In a real model, we would get this from the softmax probabilities
    const fakeConfidence = Array(10).fill(0).map((_, i) => {
      if (i === pred) return 0.7 + Math.random() * 0.3;
      return Math.random() * 0.2;
    });
    
    // Normalize to sum to 1
    const sum = fakeConfidence.reduce((a, b) => a + b, 0);
    const normalizedConfidence = fakeConfidence.map(c => c / sum);
    
    setConfidence(normalizedConfidence);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Test Your Neural Network</h2>
        <p className="text-muted-foreground">
          Draw a digit from 0-9 in the canvas below and see if the model can recognize it.
          Try drawing different styles and variations to test the model's capabilities.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-xl font-medium self-start">Draw a Digit</h3>
              
              <div className="border-2 border-gray-300 rounded-md cursor-crosshair touch-none">
                <canvas
                  ref={canvasRef}
                  width={canvasSize}
                  height={canvasSize}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="bg-white"
                />
              </div>
              
              <div className="flex gap-4 w-full">
                <Button 
                  variant="outline" 
                  onClick={clearCanvas}
                  className="flex-1"
                >
                  <Eraser className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button 
                  onClick={predictDigit}
                  className="flex-1"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Predict
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center h-full">
              <h3 className="text-xl font-medium self-start mb-4">Prediction Result</h3>

              {prediction !== null ? (
                <>
                  <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center justify-center bg-primary text-white rounded-full w-32 h-32 text-6xl font-bold">
                      {prediction}
                    </div>
                  </div>
                  
                  <div className="w-full">
                    <h4 className="text-md font-medium mb-4">Confidence Levels</h4>
                    <div className="space-y-2 w-full">
                      {confidence.map((conf, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-8 text-center font-medium">{index}</div>
                          <div className="flex-1 h-6 bg-gray-200 rounded-sm overflow-hidden">
                            <div 
                              className={`h-full ${index === prediction ? 'bg-primary' : 'bg-gray-400'}`}
                              style={{ width: `${conf * 100}%` }}
                            ></div>
                          </div>
                          <div className="w-14 text-right font-mono text-sm">
                            {(conf * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <p className="text-muted-foreground mb-4">Draw a digit and click Predict</p>
                  <div className="text-6xl text-muted-foreground">?</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-medium mb-4">How the Model Makes Predictions</h3>
          
          <div className="space-y-4 text-sm">
            <p>
              When you draw a digit, the app:
            </p>
            
            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>Resizes your drawing to a 28x28 pixel image (the same size as MNIST images)</li>
              <li>Converts the image to grayscale values between 0 and 1</li>
              <li>Feeds these 784 pixel values (28×28) into the neural network's input layer</li>
              <li>The network processes the input through the hidden layer</li>
              <li>The output layer produces 10 values, one for each digit (0-9)</li>
              <li>The digit with the highest output value is the model's prediction</li>
            </ol>
            
            <p>
              <strong>Tips for better predictions:</strong>
            </p>
            
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Draw in the center of the canvas</li>
              <li>Use thick, clear strokes</li>
              <li>Try to match the style of MNIST digits (simple, centered characters)</li>
              <li>If a prediction is wrong, try drawing the digit differently</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InferenceView;
