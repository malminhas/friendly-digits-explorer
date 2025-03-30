import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNeuralNetwork } from '@/context/NeuralNetworkContext';
import { Eraser, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { preprocessDigit } from '@/lib/preprocessing';
import { renderDigitToCanvas } from '@/lib/mnist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DrawingCanvas from './DrawingCanvas';
import MnistTestImages from './MnistTestImages';
import ConfusionMatrix from './ConfusionMatrix';

const InferenceView = () => {
  const { predictWithConfidence, testImages, testLabels } = useNeuralNetwork();
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mnistCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasSize = 280; // 10x the MNIST image size for better drawing
  const imageSize = 28; // MNIST image size
  const [showDebug, setShowDebug] = useState(false);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testMode, setTestMode] = useState<'draw' | 'mnist'>('draw');

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set up canvas with thicker lines to match MNIST style better
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.lineWidth = 28;  // Much thicker lines to match MNIST style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'black';
  }, []);

  useEffect(() => {
    if (testMode === 'mnist' && testImages && testImages.length > 0) {
      displayTestImage(currentTestIndex);
    }
  }, [currentTestIndex, testMode, testImages]);

  const displayTestImage = (index: number) => {
    if (!mnistCanvasRef.current || !testImages || index >= testImages.length) return;
    
    // Render the MNIST image to the canvas
    renderDigitToCanvas(mnistCanvasRef.current, testImages[index]);
    
    // Make prediction
    try {
      const { prediction, confidence } = predictWithConfidence(testImages[index]);
      setPrediction(prediction);
      setConfidence(confidence);
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  const handleNextTestImage = () => {
    if (!testImages) return;
    setCurrentTestIndex((prev) => (prev + 1) % testImages.length);
  };

  const handlePreviousTestImage = () => {
    if (!testImages) return;
    setCurrentTestIndex((prev) => (prev - 1 + testImages.length) % testImages.length);
  };

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
    handlePredict();
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

  // Add this function to visualize the preprocessed data
  const visualizePreprocessedData = (grayscale: number[]) => {
    const debugCanvas = debugCanvasRef.current;
    if (!debugCanvas) return;
    
    const ctx = debugCanvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.createImageData(imageSize, imageSize);
    
    for (let i = 0; i < grayscale.length; i++) {
      const value = 255 * (1 - grayscale[i]);  // Convert back to 0-255 range (inverted)
      imageData.data[i * 4] = value;     // R
      imageData.data[i * 4 + 1] = value; // G
      imageData.data[i * 4 + 2] = value; // B
      imageData.data[i * 4 + 3] = 255;   // A
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const handlePredict = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Get image data and convert to grayscale array
    const imageData = ctx.getImageData(0, 0, 28, 28);
    const grayscale = new Array(784);
    for (let i = 0; i < imageData.data.length; i += 4) {
      grayscale[i/4] = imageData.data[i] / 255; // Use only red channel
    }

    // Preprocess the digit
    const preprocessed = preprocessDigit(grayscale);

    // Make prediction
    try {
      const { prediction, confidence } = predictWithConfidence(preprocessed);
      setPrediction(prediction);
      setConfidence(confidence);
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Test Your Neural Network</h2>
        <p className="text-gray-600 mt-2">
          Test the model by either using real MNIST test images, analyzing the confusion matrix, or drawing your own digits.
        </p>
      </div>

      <Tabs defaultValue="mnist" className="w-full">
        <TabsList className="w-full grid grid-cols-3 gap-4">
          <TabsTrigger value="mnist">MNIST Test Images</TabsTrigger>
          <TabsTrigger value="confusion">Confusion Matrix</TabsTrigger>
          <TabsTrigger value="draw">Draw a Digit</TabsTrigger>
        </TabsList>

        <TabsContent value="mnist" className="mt-6">
          <MnistTestImages />
        </TabsContent>

        <TabsContent value="confusion" className="mt-6">
          <ConfusionMatrix />
        </TabsContent>

        <TabsContent value="draw" className="mt-6">
          <DrawingCanvas />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Separate component for prediction display
const PredictionDisplay = ({
  prediction,
  confidence,
  showDebug,
  setShowDebug,
  debugCanvasRef,
  imageSize,
  actualLabel
}: {
  prediction: number | null;
  confidence: number[];
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
  debugCanvasRef: React.RefObject<HTMLCanvasElement>;
  imageSize: number;
  actualLabel?: number;
}) => {
  // Determine background color based on prediction accuracy
  const getBgColor = () => {
    if (actualLabel === undefined) return 'bg-primary';
    return prediction === actualLabel ? 'bg-green-600' : 'bg-red-600';
  };

  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex items-center gap-2 self-start mb-4">
        <h3 className="text-xl font-medium">Prediction Result</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs"
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </Button>
      </div>

      {showDebug && (
        <div className="mb-4 border p-4 rounded-md">
          <h4 className="text-sm font-medium mb-2">Preprocessed Image (28x28)</h4>
          <canvas
            ref={debugCanvasRef}
            width={imageSize}
            height={imageSize}
            className="border border-gray-200 w-28 h-28"
          />
        </div>
      )}

      {prediction !== null ? (
        <>
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center justify-center ${getBgColor()} text-white rounded-full w-32 h-32 text-6xl font-bold`}>
              {prediction}
            </div>
          </div>

          <div className="w-full space-y-2">
            <h4 className="text-sm font-medium">Confidence Levels</h4>
            <div className="space-y-2">
              {confidence.map((conf, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 text-sm">{i}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${i === prediction ? getBgColor() : 'bg-gray-300'}`}
                      style={{ width: `${conf * 100}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-right">{(conf * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No prediction yet
        </div>
      )}
    </div>
  );
};

export default InferenceView;
