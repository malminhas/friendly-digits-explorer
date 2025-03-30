import { useRef, useState, useEffect } from 'react';
import { useNeuralNetwork } from '@/context/NeuralNetworkContext';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { predictWithConfidence } = useNeuralNetwork();
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set up drawing style - thicker lines to match MNIST characteristics
    ctx.lineWidth = 28; // Much thicker lines to match MNIST style
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

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      // Touch event
      e.preventDefault(); // Prevent scrolling while drawing
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      // Touch event
      e.preventDefault(); // Prevent scrolling while drawing
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    makePrediction();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    setPrediction(null);
    setConfidence([]);
  };

  const makePrediction = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // First, create a temporary canvas at a larger size for better anti-aliasing
    const tempCanvas = document.createElement('canvas');
    const scaleFactor = 2; // Scale up for better quality
    tempCanvas.width = 28 * scaleFactor;
    tempCanvas.height = 28 * scaleFactor;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Set white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Calculate scaling to maintain aspect ratio and center the digit
    const sourceAspect = canvas.width / canvas.height;
    const targetAspect = 1; // Square target
    
    let sourceWidth = canvas.width;
    let sourceHeight = canvas.height;
    let sourceX = 0;
    let sourceY = 0;

    if (sourceAspect > targetAspect) {
      // Source is wider than target
      sourceWidth = canvas.height;
      sourceX = (canvas.width - sourceWidth) / 2;
    } else {
      // Source is taller than target
      sourceHeight = canvas.width;
      sourceY = (canvas.height - sourceHeight) / 2;
    }

    // Draw scaled and centered image
    tempCtx.drawImage(
      canvas,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, tempCanvas.width, tempCanvas.height
    );

    // Now scale down to final 28x28 with better quality
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 28;
    finalCanvas.height = 28;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return;

    finalCtx.fillStyle = 'white';
    finalCtx.fillRect(0, 0, 28, 28);
    finalCtx.drawImage(tempCanvas, 0, 0, 28, 28);

    // Get image data and process
    const imageData = finalCtx.getImageData(0, 0, 28, 28);
    const input = new Array(784);
    
    // Convert to grayscale and normalize, matching MNIST characteristics
    for (let i = 0; i < imageData.data.length; i += 4) {
      const grayscale = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      input[i / 4] = (255 - grayscale) / 255; // Invert and normalize
    }

    // Make prediction
    const result = predictWithConfidence(input);
    setPrediction(result.prediction);
    setConfidence(result.confidence);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Drawing Canvas */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Draw a Digit</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="border-2 border-gray-300 bg-white rounded-lg">
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                className="touch-none"
              />
            </div>
            <Button onClick={clear} variant="outline" className="w-32">
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Prediction Result */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Prediction Result</h3>
          {prediction !== null ? (
            <div className="flex flex-col items-center justify-center h-[200px] space-y-2">
              <div className="w-24 h-24 rounded-full bg-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                {prediction}
              </div>
              <div className="text-sm text-gray-600">
                Confidence: {(confidence[prediction] * 100).toFixed(1)}%
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              No prediction yet
            </div>
          )}
        </div>
      </Card>

      {/* Prediction Breakdown */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Prediction Breakdown</h3>
          {prediction !== null && confidence.length > 0 ? (
            <div className="space-y-2">
              {confidence.map((conf, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 text-right text-sm">{i}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${i === prediction ? 'bg-green-600' : 'bg-gray-300'}`}
                      style={{ width: `${conf * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm">
                    {(conf * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              No prediction yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 