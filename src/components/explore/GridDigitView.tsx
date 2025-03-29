
import { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { renderDigitToCanvas } from '@/lib/mnist';
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
  const [gridSize, setGridSize] = useState(5);
  const gridCanvasesRef = useRef<(HTMLCanvasElement | null)[]>([]);
  
  // Initialize grid canvases refs
  useEffect(() => {
    gridCanvasesRef.current = Array(gridSize * gridSize).fill(null);
  }, [gridSize]);

  // Render grid of digits
  useEffect(() => {
    if (trainImages && trainImages.length > 0) {
      const startIndex = Math.floor(currentIndex / (gridSize * gridSize)) * gridSize * gridSize;
      
      gridCanvasesRef.current.forEach((canvas, i) => {
        const idx = startIndex + i;
        if (canvas && idx < trainImages.length) {
          renderDigitToCanvas(canvas, trainImages[idx]);
        }
      });
    }
  }, [trainImages, currentIndex, gridSize]);

  const handlePreviousGrid = () => {
    const gridCount = gridSize * gridSize;
    const currentGroup = Math.floor(currentIndex / gridCount);
    const totalGroups = Math.ceil((trainImages?.length || 0) / gridCount);
    const newGroup = currentGroup > 0 ? currentGroup - 1 : totalGroups - 1;
    setCurrentIndex(newGroup * gridCount);
  };

  const handleNextGrid = () => {
    const gridCount = gridSize * gridSize;
    const currentGroup = Math.floor(currentIndex / gridCount);
    const totalGroups = Math.ceil((trainImages?.length || 0) / gridCount);
    const newGroup = currentGroup < totalGroups - 1 ? currentGroup + 1 : 0;
    setCurrentIndex(newGroup * gridCount);
  };

  const getCurrentPage = () => {
    const gridCount = gridSize * gridSize;
    return Math.floor(currentIndex / gridCount) + 1;
  };

  const getTotalPages = () => {
    const gridCount = gridSize * gridSize;
    return Math.ceil((trainImages?.length || 0) / gridCount);
  };
  
  return (
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
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={handlePreviousGrid} />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>
              Page {getCurrentPage()} of {getTotalPages()}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext onClick={handleNextGrid} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

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
                className={`border ${hasImage ? 'border-gray-200 bg-white' : 'border-transparent bg-gray-100'}`}
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
  );
};

export default GridDigitView;
