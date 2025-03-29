
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { renderDigitToCanvas } from '@/lib/mnist';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SingleDigitViewProps {
  trainImages: number[][];
  trainLabels: number[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

const SingleDigitView = ({ 
  trainImages, 
  trainLabels, 
  currentIndex, 
  setCurrentIndex 
}: SingleDigitViewProps) => {
  const [digitSize, setDigitSize] = useState(200);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Render digit when current index changes
  useEffect(() => {
    if (trainImages && trainImages.length > 0 && canvasRef.current) {
      renderDigitToCanvas(canvasRef.current, trainImages[currentIndex]);
    }
  }, [trainImages, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex(prev => 
      prev > 0 ? prev - 1 : (trainImages?.length || 1) - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex(prev => 
      prev < (trainImages?.length || 1) - 1 ? prev + 1 : 0
    );
  };
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="w-full max-w-md overflow-hidden">
        <CardContent className="p-4 flex flex-col items-center">
          <div className="relative mb-4">
            <canvas 
              ref={canvasRef} 
              width={28} 
              height={28} 
              className="border border-gray-200 bg-white"
              style={{ 
                width: `${digitSize}px`, 
                height: `${digitSize}px`, 
                imageRendering: 'pixelated' 
              }}
            />
            <div className="absolute bottom-2 right-2 bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
              {trainLabels[currentIndex]}
            </div>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-lg font-medium">Digit: {trainLabels[currentIndex]}</p>
            <p className="text-sm text-muted-foreground">Image {currentIndex + 1} of {trainImages.length.toLocaleString()}</p>
          </div>

          <div className="flex justify-between w-full">
            <Button onClick={handlePrevious} size="icon" variant="outline">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button onClick={handleNext} size="icon" variant="outline">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-md">
        <Label htmlFor="digit-size">Digit Size: {digitSize}px</Label>
        <Slider
          id="digit-size"
          min={50}
          max={300}
          step={10}
          value={[digitSize]}
          onValueChange={(value) => setDigitSize(value[0])}
          className="mt-2"
        />
      </div>
    </div>
  );
};

export default SingleDigitView;
