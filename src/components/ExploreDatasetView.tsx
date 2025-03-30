import { useState, useEffect } from 'react';
import { useNeuralNetwork } from '@/hooks/useNeuralNetworkContext';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import LoadingSpinner from './explore/LoadingSpinner';
import ViewToggle from './explore/ViewToggle';
import SingleDigitView from './explore/SingleDigitView';
import GridDigitView from './explore/GridDigitView';
import { ExternalLink } from 'lucide-react';

const ExploreDatasetView = () => {
  const { trainImages, trainLabels, datasetLoaded, loadDataset } = useNeuralNetwork();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (!datasetLoaded) {
        try {
          await loadDataset();
          setIsLoading(false);
          setTimeout(() => {
            toast({
              title: "Dataset Loaded",
              description: "The MNIST dataset has been loaded successfully.",
              duration: 1000,
            });
          }, 100);
        } catch (error) {
          console.error('Error in dataset loading:', error);
          setIsLoading(false);
          setTimeout(() => {
            toast({
              title: "Using Fallback Data",
              description: "Could not load MNIST dataset. Using synthetic data instead.",
              variant: "destructive",
              duration: 1000,
            });
          }, 100);
        }
      } else {
        setIsLoading(false);
      }
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
      <div>
        <h2 className="text-2xl font-bold">Explore the MNIST Training Dataset</h2>
        <p className="text-muted-foreground mt-2">
          Explore a curated subset of {trainImages.length.toLocaleString()} training images from the MNIST dataset, 
          a foundational collection of handwritten digits widely used in machine learning education and research.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4 text-sm">
          <h3 className="text-xl font-medium mb-4">How MNIST Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-md">
              <h4 className="font-medium mb-2 text-foreground">Dataset Origins</h4>
              <p className="text-muted-foreground">
                Created in 1998 by Yann LeCun, Corinna Cortes, and Christopher Burges, MNIST contains digits written by 
                high school students and Census Bureau employees, making it diverse and realistic.
              </p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <h4 className="font-medium mb-2 text-foreground">Image Format</h4>
              <p className="text-muted-foreground">
                Each image is <strong>28x28 pixels</strong> in grayscale, with pixel values from 0 (white) to 255 (black), 
                providing <strong>784 input features</strong> for the neural network to learn from.
              </p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <h4 className="font-medium mb-2 text-foreground">Dataset Size</h4>
              <p className="text-muted-foreground">
                The full MNIST dataset contains <strong>60,000 training images</strong> and <strong>10,000 test images</strong>. 
                For this explorer, we use a subset to ensure fast loading and smooth performance.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <div className="p-3 bg-muted rounded-md text-muted-foreground">
              <p className="mb-2">You can explore the training dataset in two ways:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Single View:</strong> Examine individual training digits in detail with adjustable size. Perfect for studying the pixel-level details and variations in handwriting styles.</li>
                <li><strong>Grid View:</strong> See 100 training digits at once in a 10x10 grid. Great for understanding the variety of writing styles and spotting patterns across multiple examples.</li>
              </ul>
            </div>
          </div>
          <p className="text-muted-foreground">
            Known as the "Hello World" of machine learning, MNIST is often the first dataset used to teach neural networks 
            because it's complex enough to be interesting but simple enough to learn from. Learn more:{' '}
            <a 
              href="https://en.wikipedia.org/wiki/MNIST_database" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              MNIST Database on Wikipedia <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </Card>

      <div>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

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
