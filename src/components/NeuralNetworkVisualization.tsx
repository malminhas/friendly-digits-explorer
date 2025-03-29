
import { useEffect, useRef } from 'react';
import { useNeuralNetwork } from '@/hooks/useNeuralNetworkContext';

interface NeuralNetworkVisualizationProps {
  inputLayer: number;
  hiddenLayer: number;
  outputLayer: number;
  showWeights?: boolean;
  width?: number;
  height?: number;
}

const NeuralNetworkVisualization = ({
  inputLayer = 784,
  hiddenLayer = 128,
  outputLayer = 10,
  showWeights = true,
  width = 800,
  height = 400
}: NeuralNetworkVisualizationProps) => {
  const { weights1, weights2 } = useNeuralNetwork();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate how many nodes to display
  const maxNodesToShow = {
    input: 20,    // Show at most 20 input nodes to avoid clutter
    hidden: 15,   // Show at most 15 hidden nodes to avoid clutter
    output: 10    // Show all output nodes (0-9)
  };

  useEffect(() => {
    if (!canvasRef.current || !weights1 || !weights2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate node positions
    const nodeRadius = 8;
    const spacingY = {
      input: height / (maxNodesToShow.input + 1),
      hidden: height / (maxNodesToShow.hidden + 1),
      output: height / (maxNodesToShow.output + 1)
    };

    // Calculate layer positions
    const layerX = {
      input: width * 0.15,   // Moved left a bit to make more room for connections
      hidden: width * 0.5,
      output: width * 0.85   // Moved right a bit to make more room for connections and labels
    };

    // Draw connections first (behind nodes)
    if (showWeights && weights1 && weights2) {
      // Draw a subset of connections to avoid clutter
      const inputStep = Math.floor(inputLayer / maxNodesToShow.input);
      const hiddenStep = Math.floor(hiddenLayer / maxNodesToShow.hidden);

      // Draw connections between input and hidden layers
      for (let i = 0; i < maxNodesToShow.input; i++) {
        const inputIndex = i * inputStep;
        const inputY = (i + 1) * spacingY.input;

        for (let j = 0; j < maxNodesToShow.hidden; j++) {
          const hiddenIndex = j * hiddenStep;
          const hiddenY = (j + 1) * spacingY.hidden;

          // Get the weight value and determine connection color and width
          const weight = weights1[inputIndex][hiddenIndex];
          const absWeight = Math.abs(weight);
          const maxWeight = 0.5; // Normalize weight for visualization
          const normalizedWeight = Math.min(absWeight / maxWeight, 1);
          
          // Determine color based on weight sign
          const weightColor = weight > 0 
            ? `rgba(0, 128, 255, ${normalizedWeight * 0.7})`
            : `rgba(255, 0, 0, ${normalizedWeight * 0.7})`;
          
          // Determine line width based on weight magnitude
          const lineWidth = Math.max(normalizedWeight * 3, 0.5); // Ensure minimum visibility
          
          // Draw connection
          ctx.beginPath();
          ctx.moveTo(layerX.input, inputY);
          ctx.lineTo(layerX.hidden, hiddenY);
          ctx.strokeStyle = weightColor;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      }

      // Draw connections between hidden and output layers
      for (let j = 0; j < maxNodesToShow.hidden; j++) {
        const hiddenIndex = j * hiddenStep;
        const hiddenY = (j + 1) * spacingY.hidden;

        for (let k = 0; k < outputLayer; k++) {
          const outputY = (k + 1) * spacingY.output;

          // Get the weight value and determine connection color and width
          const weight = weights2[hiddenIndex][k];
          const absWeight = Math.abs(weight);
          const maxWeight = 0.5; // Normalize weight for visualization
          const normalizedWeight = Math.min(absWeight / maxWeight, 1);
          
          // Determine color based on weight sign
          const weightColor = weight > 0 
            ? `rgba(0, 128, 255, ${normalizedWeight * 0.7})`
            : `rgba(255, 0, 0, ${normalizedWeight * 0.7})`;
          
          // Determine line width based on weight magnitude
          const lineWidth = Math.max(normalizedWeight * 3, 0.5); // Ensure minimum visibility
          
          // Draw connection
          ctx.beginPath();
          ctx.moveTo(layerX.hidden, hiddenY);
          ctx.lineTo(layerX.output, outputY);
          ctx.strokeStyle = weightColor;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    // Input layer nodes
    ctx.fillStyle = '#6366f1';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1;
    const drawInputCount = Math.min(inputLayer, maxNodesToShow.input);
    const inputStep = Math.floor(inputLayer / drawInputCount);
    
    for (let i = 0; i < drawInputCount; i++) {
      const y = (i + 1) * spacingY.input;
      // Draw node
      ctx.beginPath();
      ctx.arc(layerX.input, y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Input layer label
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Input Layer (784 nodes)`, layerX.input, height - 10);

    // Hidden layer nodes
    ctx.fillStyle = '#8b5cf6';
    ctx.strokeStyle = '#7c3aed';
    const drawHiddenCount = Math.min(hiddenLayer, maxNodesToShow.hidden);
    const hiddenStep = Math.floor(hiddenLayer / drawHiddenCount);
    
    for (let i = 0; i < drawHiddenCount; i++) {
      const y = (i + 1) * spacingY.hidden;
      // Draw node
      ctx.beginPath();
      ctx.arc(layerX.hidden, y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Hidden layer label
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Hidden Layer (128 nodes)`, layerX.hidden, height - 10);

    // Output layer nodes
    ctx.fillStyle = '#ec4899';
    ctx.strokeStyle = '#db2777';
    
    for (let i = 0; i < outputLayer; i++) {
      const y = (i + 1) * spacingY.output;
      // Draw node
      ctx.beginPath();
      ctx.arc(layerX.output, y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Label each output node with its digit
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left'; // Changed to left alignment for better spacing
      ctx.fillText(`${i}`, layerX.output + nodeRadius * 2, y + 4); // Moved label to the right side of the node
    }

    // Output layer label
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Output Layer (10 nodes)`, layerX.output, height - 10);

    // Draw the ellipsis for skipped nodes
    const drawEllipsis = (x: number, y: number) => {
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⋮', x, y);
    };

    if (inputLayer > maxNodesToShow.input) {
      drawEllipsis(layerX.input, height * 0.5);
    }
    
    if (hiddenLayer > maxNodesToShow.hidden) {
      drawEllipsis(layerX.hidden, height * 0.5);
    }

  }, [weights1, weights2, showWeights, inputLayer, hiddenLayer, outputLayer, height, width]);

  return (
    <div className="relative w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="mx-auto"
      />
      
      {/* Moved legend to the bottom with more space and better positioning */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-6 text-sm bg-white/80 py-2 px-4 rounded">
        <span className="inline-flex items-center">
          <span className="inline-block w-4 h-4 mr-2 bg-blue-500 rounded-full opacity-70"></span>
          Strong positive weight
        </span>
        <span className="inline-flex items-center">
          <span className="inline-block w-4 h-4 mr-2 bg-red-500 rounded-full opacity-70"></span>
          Strong negative weight
        </span>
      </div>
    </div>
  );
};

export default NeuralNetworkVisualization;
