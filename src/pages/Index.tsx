import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExploreDatasetView from '@/components/ExploreDatasetView';
import TrainingView from '@/components/TrainingView';
import InferenceView from '@/components/InferenceView';
import AppHeader from '@/components/AppHeader';
import { useToast } from '@/components/ui/use-toast';
import { NeuralNetworkProvider, useNeuralNetwork } from '@/context/NeuralNetworkContext';

// Wrap the main content in a component that has access to the neural network context
const MainContent = () => {
  const [activeTab, setActiveTab] = useState('explore');
  const [modelTrained, setModelTrained] = useState(false);
  const { toast } = useToast();
  const { modelMetadata } = useNeuralNetwork();

  // Check if model is trained when the component mounts or modelMetadata changes
  useEffect(() => {
    if (modelMetadata) {
      setModelTrained(true);
    }
  }, [modelMetadata]);

  const handleModelTrained = () => {
    setModelTrained(true);
    toast({
      title: "Model trained successfully!",
      description: "You can now test your model by drawing digits.",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 md:px-8">
      <AppHeader />
      
      <Card className="w-full mt-6 mb-8">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="explore">Explore Dataset</TabsTrigger>
              <TabsTrigger value="train">Train Model</TabsTrigger>
              <TabsTrigger value="inference" disabled={!modelTrained}>
                Test Model
                {!modelTrained && (
                  <span className="ml-2 text-xs text-muted-foreground">(Train first)</span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="explore" className="mt-6">
              <ExploreDatasetView />
            </TabsContent>
            
            <TabsContent value="train" className="mt-6">
              <TrainingView onTrainingComplete={handleModelTrained} />
            </TabsContent>
            
            <TabsContent value="inference" className="mt-6">
              <InferenceView />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const Index = () => {
  return (
    <NeuralNetworkProvider>
      <MainContent />
    </NeuralNetworkProvider>
  );
};

export default Index;
