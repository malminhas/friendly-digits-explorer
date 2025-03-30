import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DrawingCanvas from '@/components/DrawingCanvas';
import MnistTestImages from '@/components/MnistTestImages';
import ConfusionMatrix from '@/components/ConfusionMatrix';

export default function TestView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Test Your Neural Network</h2>
        <p className="text-gray-600 mt-2">
          Test the model by either using real MNIST test images, analyzing the confusion matrix, or drawing your own digits.
        </p>
      </div>

      <Tabs defaultValue="mnist" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="mnist" className="flex-1">MNIST Test Images</TabsTrigger>
          <TabsTrigger value="confusion" className="flex-1">Confusion Matrix</TabsTrigger>
          <TabsTrigger value="draw" className="flex-1">Draw a Digit</TabsTrigger>
        </TabsList>

        <TabsContent value="mnist">
          <MnistTestImages />
        </TabsContent>

        <TabsContent value="confusion">
          <ConfusionMatrix />
        </TabsContent>

        <TabsContent value="draw">
          <DrawingCanvas />
        </TabsContent>
      </Tabs>
    </div>
  );
} 