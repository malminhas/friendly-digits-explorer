
import { useState, useEffect } from 'react';
import { useNeuralNetwork } from '@/context/NeuralNetworkContext';
import { toast } from '@/hooks/use-toast';
import LoadingSpinner from './explore/LoadingSpinner';
import ViewToggle from './explore/ViewToggle';
import SingleDigitView from './explore/SingleDigitView';
import GridDigitView from './explore/GridDigitView';

const ExploreDatasetView = () => {
  const { trainImages, trainLabels, datasetLoaded, loadDataset } = useNeuralNetwork();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  useEffect(() => {
    if (!datasetLoaded) {
      loadDataset().then(() => {
        toast({
          title: "Dataset Loaded",
          description: "The MNIST dataset has been loaded successfully."
        });
      }).catch(error => {
        toast({
          title: "Error",
          description: "Failed to load the MNIST dataset. Using fallback data.",
          variant: "destructive"
        });
      });
    }
  }, [datasetLoaded, loadDataset]);

  if (!datasetLoaded || !trainImages || trainImages.length === 0) {
    return <LoadingSpinner />;
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
