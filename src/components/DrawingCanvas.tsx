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

    // Stroke width tuned so that after bounding-box crop + scale to 20x20,
    // strokes end up ~2-3px wide, matching MNIST training data.
    ctx.lineWidth = 18;
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

    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Step 1: Find bounding box of drawn content (non-white pixels)
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasContent = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (brightness < 240) {
          hasContent = true;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasContent) return;

    // Step 2: Add padding around the bounding box
    const pad = 15;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);

    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;

    // Step 3: Scale bounding box to fit within 20x20 (MNIST standard),
    // preserving aspect ratio
    const fitSize = 20;
    const scale = fitSize / Math.max(bw, bh);
    const sw = Math.round(bw * scale);
    const sh = Math.round(bh * scale);

    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = sw;
    scaledCanvas.height = sh;
    const scaledCtx = scaledCanvas.getContext('2d');
    if (!scaledCtx) return;

    scaledCtx.fillStyle = 'white';
    scaledCtx.fillRect(0, 0, sw, sh);
    scaledCtx.imageSmoothingEnabled = true;
    scaledCtx.imageSmoothingQuality = 'medium';
    scaledCtx.drawImage(canvas, minX, minY, bw, bh, 0, 0, sw, sh);

    // Step 4: Read scaled pixels and compute center of mass
    const scaledData = scaledCtx.getImageData(0, 0, sw, sh);
    const pixels = new Float32Array(sw * sh);
    let totalMass = 0, comX = 0, comY = 0;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = (y * sw + x) * 4;
        const gray = (scaledData.data[idx] + scaledData.data[idx + 1] + scaledData.data[idx + 2]) / 3;
        const value = (255 - gray) / 255;
        pixels[y * sw + x] = value;
        totalMass += value;
        comX += x * value;
        comY += y * value;
      }
    }

    if (totalMass === 0) return;

    comX /= totalMass;
    comY /= totalMass;

    // Step 5: Place into 28x28, shifting so center of mass lands at (13.5, 13.5)
    const input = new Array(784).fill(0);
    const offsetX = Math.round(13.5 - comX);
    const offsetY = Math.round(13.5 - comY);

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const nx = x + offsetX;
        const ny = y + offsetY;
        if (nx >= 0 && nx < 28 && ny >= 0 && ny < 28) {
          input[ny * 28 + nx] = pixels[y * sw + x];
        }
      }
    }

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