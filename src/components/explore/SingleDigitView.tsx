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
  const [digitSize, setDigitSize] = useState(280);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Render digit when current index changes
  useEffect(() => {
    if (trainImages && trainImages.length > 0 && canvasRef.current) {
      try {
        renderDigitToCanvas(canvasRef.current, trainImages[currentIndex]);
      } catch (err) {
        console.error("Failed to render digit:", err);
      }
    }
  }, [trainImages, currentIndex, digitSize]);

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : (trainImages?.length || 1) - 1;
    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex < (trainImages?.length || 1) - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
  };

  const handleSliderChange = (value: number[]) => {
    setCurrentIndex(value[0]);
  };
  
  return (
    <div className="flex flex-col items-center space-y-6">
      <Card className="w-full max-w-2xl overflow-hidden">
        <CardContent className="p-6 flex flex-col items-center">
          <div className="relative mb-4">
            <canvas 
              ref={canvasRef} 
              width={280} 
              height={280} 
              className="border border-gray-200 bg-white"
              style={{ 
                width: `${digitSize}px`, 
                height: `${digitSize}px`, 
                imageRendering: 'pixelated' 
              }}
            />
            <div className="absolute bottom-4 right-4 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
              {trainLabels[currentIndex]}
            </div>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-lg font-medium">Digit: {trainLabels[currentIndex]}</p>
            <p className="text-sm text-muted-foreground">Image {currentIndex + 1} of {trainImages.length.toLocaleString()}</p>
          </div>

          <div className="w-full space-y-6">
            {/* Navigation Slider */}
            <div className="space-y-2">
              <Label>Navigate Dataset</Label>
              <div className="flex items-center gap-4">
                <Button onClick={handlePrevious} size="icon" variant="outline">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Slider
                  value={[currentIndex]}
                  min={0}
                  max={trainImages.length - 1}
                  step={1}
                  onValueChange={handleSliderChange}
                  className="flex-1"
                />
                <Button onClick={handleNext} size="icon" variant="outline">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Size Slider */}
            <div className="space-y-2">
              <Label htmlFor="digit-size">Digit Size: {digitSize}px</Label>
              <Slider
                id="digit-size"
                min={100}
                max={400}
                step={20}
                value={[digitSize]}
                onValueChange={(value) => setDigitSize(value[0])}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SingleDigitView;
