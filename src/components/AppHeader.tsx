import { Brain } from 'lucide-react';

const AppHeader = () => {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-md">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">MNIST Neural Network Explorer</h1>
          <p className="text-muted-foreground">Demystifying neural networks with MNIST digits</p>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
