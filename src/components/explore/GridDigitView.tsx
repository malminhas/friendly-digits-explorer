import { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { renderDigitToCanvas } from '@/lib/mnist';
import { generateSyntheticDigit } from '@/lib/mnist-data';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface GridDigitViewProps {
  trainImages: number[][];
  trainLabels: number[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

const GridDigitView = ({
  trainImages,
  trainLabels,
  currentIndex,
  setCurrentIndex
}: GridDigitViewProps) => {
  const gridCanvasesRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const GRID_SIZE = 100; // 10x10 grid
  const [canvasesInitialized, setCanvasesInitialized] = useState(false);
  
  // Initialize grid canvases refs and trigger initial render
  useEffect(() => {
    if (trainImages?.length > 0) {
      console.log("Initializing canvases and preparing for initial render");
      gridCanvasesRef.current = Array(GRID_SIZE).fill(null);
      setCanvasesInitialized(true);
    }
  }, [trainImages]);

  // Render grid of digits once canvases are initialized
  useEffect(() => {
    if (!canvasesInitialized || !trainImages?.length) return;

    console.log("Rendering grid with currentIndex:", currentIndex);
    console.log("Number of training images:", trainImages.length);
    console.log("First few labels:", trainLabels?.slice(0, 10));

    // Clear all canvases first
    gridCanvasesRef.current.forEach((canvas, i) => {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });

    // Small delay to ensure canvas refs are properly set
    requestAnimationFrame(() => {
      // Render actual training images
      for (let i = 0; i < GRID_SIZE; i++) {
        const imageIndex = currentIndex + i;
        if (imageIndex < trainImages.length) {
          const canvas = gridCanvasesRef.current[i];
          if (canvas) {
            try {
              console.log(`Rendering digit at index ${imageIndex}, label: ${trainLabels[imageIndex]}`);
              
              // Ensure canvas is properly sized
              canvas.width = 28;
              canvas.height = 28;
              
              // Render the digit
              renderDigitToCanvas(canvas, trainImages[imageIndex]);
            } catch (error) {
              console.error(`Error rendering digit ${i}:`, error);
            }
          }
        }
      }
    });
  }, [trainImages, trainLabels, currentIndex, canvasesInitialized]);

  const handlePreviousGrid = () => {
    const startIdx = Math.max(0, currentIndex - GRID_SIZE);
    setCurrentIndex(startIdx);
  };

  const handleNextGrid = () => {
    const nextIdx = Math.min(currentIndex + GRID_SIZE, (trainImages?.length || 0) - GRID_SIZE);
    setCurrentIndex(nextIdx);
  };

  const getCurrentPage = () => {
    return Math.floor(currentIndex / GRID_SIZE) + 1;
  };

  const getTotalPages = () => {
    return Math.ceil((trainImages?.length || 0) / GRID_SIZE);
  };
  
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Label>Showing 100 digits (10x10 grid)</Label>
          <div className="text-sm text-muted-foreground">
            Starting from example {currentIndex + 1}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 mb-6">
          <PaginationPrevious 
            onClick={handlePreviousGrid}
            className="cursor-pointer"
          />
          <div className="text-center px-8">
            Set {getCurrentPage()} of {getTotalPages()}
          </div>
          <PaginationNext 
            onClick={handleNextGrid}
            className="cursor-pointer"
          />
        </div>
      </div>

      <div 
        className="grid gap-4 mx-auto p-4" 
        style={{ 
          gridTemplateColumns: 'repeat(10, 1fr)',
          gridTemplateRows: 'repeat(10, 1fr)',
          width: 'fit-content'
        }}
      >
        {Array.from({ length: GRID_SIZE }).map((_, idx) => (
          <div key={idx} className="relative">
            <canvas
              ref={el => gridCanvasesRef.current[idx] = el}
              className="border border-gray-200 bg-white"
              style={{ 
                width: '100px', 
                height: '100px', 
                imageRendering: 'pixelated',
              }}
            />
            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
              {trainLabels[currentIndex + idx]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GridDigitView;
