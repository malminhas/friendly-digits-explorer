
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { renderDigitToCanvas } from '@/lib/mnist';
import { useNeuralNetwork } from '@/context/NeuralNetworkContext';
import { ChevronLeft, ChevronRight, Grid, Rows } from 'lucide-react';

const ExploreDatasetView = () => {
  const { trainImages, trainLabels, datasetLoaded, loadDataset } = useNeuralNetwork();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [digitSize, setDigitSize] = useState(200);
  const [gridSize, setGridSize] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasesRef = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    if (!datasetLoaded) {
      loadDataset();
    }
  }, [datasetLoaded, loadDataset]);

  useEffect(() => {
    if (datasetLoaded && trainImages.length > 0 && viewMode === 'single' && canvasRef.current) {
      renderDigitToCanvas(canvasRef.current, trainImages[currentIndex]);
    }
  }, [datasetLoaded, trainImages, currentIndex, viewMode]);

  useEffect(() => {
    if (datasetLoaded && trainImages.length > 0 && viewMode === 'grid') {
      const startIndex = Math.floor(currentIndex / (gridSize * gridSize)) * gridSize * gridSize;
      
      for (let i = 0; i < gridSize * gridSize; i++) {
        const idx = startIndex + i;
        const canvas = gridCanvasesRef.current[i];
        
        if (canvas && idx < trainImages.length) {
          renderDigitToCanvas(canvas, trainImages[idx]);
        }
      }
    }
  }, [datasetLoaded, trainImages, currentIndex, viewMode, gridSize]);

  const handlePrevious = () => {
    setCurrentIndex(prev => 
      prev > 0 ? prev - 1 : trainImages.length - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex(prev => 
      prev < trainImages.length - 1 ? prev + 1 : 0
    );
  };

  const handlePreviousGrid = () => {
    const gridCount = gridSize * gridSize;
    const currentGroup = Math.floor(currentIndex / gridCount);
    const newGroup = currentGroup > 0 ? currentGroup - 1 : Math.floor((trainImages.length - 1) / gridCount);
    setCurrentIndex(newGroup * gridCount);
  };

  const handleNextGrid = () => {
    const gridCount = gridSize * gridSize;
    const currentGroup = Math.floor(currentIndex / gridCount);
    const maxGroup = Math.floor((trainImages.length - 1) / gridCount);
    const newGroup = currentGroup < maxGroup ? currentGroup + 1 : 0;
    setCurrentIndex(newGroup * gridCount);
  };

  // Initialize grid canvases refs
  useEffect(() => {
    gridCanvasesRef.current = Array(gridSize * gridSize).fill(null);
  }, [gridSize]);

  if (!datasetLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="mb-4">Loading MNIST dataset...</p>
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Explore the MNIST Dataset</h2>
        <p className="text-muted-foreground">
          The MNIST dataset contains images of handwritten digits from 0-9. 
          Each image is 28x28 pixels in grayscale. Explore the dataset to understand 
          what kind of data the neural network will learn from.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button 
          variant={viewMode === 'single' ? 'default' : 'outline'} 
          onClick={() => setViewMode('single')}
          className="flex items-center gap-2"
        >
          <Rows className="w-4 h-4" />
          Single View
        </Button>
        <Button 
          variant={viewMode === 'grid' ? 'default' : 'outline'} 
          onClick={() => setViewMode('grid')}
          className="flex items-center gap-2"
        >
          <Grid className="w-4 h-4" />
          Grid View
        </Button>
      </div>

      {viewMode === 'single' && (
        <div className="flex flex-col items-center space-y-4">
          <Card className="w-full max-w-md overflow-hidden">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="relative mb-4">
                <canvas 
                  ref={canvasRef} 
                  width={28} 
                  height={28} 
                  className="border border-gray-200"
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
                <p className="text-sm text-muted-foreground">Image {currentIndex + 1} of {trainImages.length}</p>
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
      )}

      {viewMode === 'grid' && (
        <div className="space-y-4">
          <div className="w-full">
            <Label htmlFor="grid-size">Grid Size: {gridSize}x{gridSize}</Label>
            <Slider
              id="grid-size"
              min={2}
              max={10}
              step={1}
              value={[gridSize]}
              onValueChange={(value) => setGridSize(value[0])}
              className="mt-2"
            />
          </div>
          
          <div className="flex justify-between mb-4">
            <Button onClick={handlePreviousGrid} size="sm" variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous Page
            </Button>
            <Button onClick={handleNextGrid} size="sm" variant="outline">
              Next Page <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div 
            className="grid gap-2 mx-auto" 
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              width: 'fit-content'
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const imageIdx = Math.floor(currentIndex / (gridSize * gridSize)) * gridSize * gridSize + idx;
              const hasImage = imageIdx < trainImages.length;
              
              return (
                <div key={idx} className="relative">
                  <canvas
                    ref={el => gridCanvasesRef.current[idx] = el}
                    width={28}
                    height={28}
                    className={`border ${hasImage ? 'border-gray-200' : 'border-transparent bg-gray-100'}`}
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      imageRendering: 'pixelated',
                      display: hasImage ? 'block' : 'none'
                    }}
                  />
                  {hasImage && (
                    <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {trainLabels[imageIdx]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreDatasetView;
