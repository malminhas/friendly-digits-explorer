
import { useState, useEffect } from 'react';
import { useNeuralNetwork } from '@/hooks/useNeuralNetworkContext';
import { toast } from '@/hooks/use-toast';
import LoadingSpinner from './explore/LoadingSpinner';
import ViewToggle from './explore/ViewToggle';
import SingleDigitView from './explore/SingleDigitView';
import GridDigitView from './explore/GridDigitView';

const ExploreDatasetView = () => {
  const { trainImages, trainLabels, datasetLoaded, loadDataset } = useNeuralNetwork();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (!datasetLoaded) {
        try {
          await loadDataset();
          toast({
            title: "Dataset Loaded",
            description: "The MNIST dataset has been loaded successfully."
          });
        } catch (error) {
          console.error('Error in dataset loading:', error);
          toast({
            title: "Using Fallback Data",
            description: "Could not load MNIST dataset. Using synthetic data instead.",
            variant: "destructive"
          });
        }
      }
      // Short delay to ensure rendering has time to complete
      setTimeout(() => setIsLoading(false), 100);
    };
    
    loadData();
  }, [datasetLoaded, loadDataset]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!trainImages || trainImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-lg text-center">
          No dataset found. Please refresh the page or check the console for errors.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Explore the MNIST Dataset</h2>
        <p className="text-muted-foreground">
          The MNIST dataset contains {trainImages.length.toLocaleString()} images of handwritten digits from 0-9. 
          Each image is 28x28 pixels in grayscale. Explore the dataset to understand 
          what kind of data the neural network will learn from.
        </p>
      </div>

      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

      {viewMode === 'single' && (
        <SingleDigitView 
          trainImages={trainImages}
          trainLabels={trainLabels}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
      )}

      {viewMode === 'grid' && (
        <GridDigitView
          trainImages={trainImages}
          trainLabels={trainLabels}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
      )}
    </div>
  );
};

export default ExploreDatasetView;
