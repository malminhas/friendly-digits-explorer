import { useEffect, useRef } from 'react';

interface NeuralNetworkVisualizationProps {
  weights1: number[][] | null;
  weights2: number[][] | null;
  biases1: number[] | null;
  biases2: number[] | null;
  hiddenNodes: number;
}

const INPUT_NODES = 784;  // 28x28 pixels
const OUTPUT_NODES = 10;  // 10 digits (0-9)
const NODE_RADIUS = 4;  // Slightly smaller nodes for better density
const LAYER_SPACING = 160;  // Adjusted for better proportions
const VERTICAL_SPACING = 8;  // Further reduced spacing to fit all nodes
const MAX_VISIBLE_NODES = 64;  // Show all hidden layer nodes
const CONNECTION_OPACITY_BACKGROUND = 0.08;  // More subtle background connections
const CONNECTION_OPACITY_FOREGROUND = 0.4;  // Clearer foreground connections
const CONNECTION_SCALE = 2.5;  // Scale factor for connection thickness
const TOP_PADDING = 50;  // Reduced from 100 to move everything up

export default function NeuralNetworkVisualization({
  weights1,
  weights2,
  biases1,
  biases2,
  hiddenNodes
}: NeuralNetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on container size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = Math.max(600, container.clientWidth);
      canvas.height = Math.max(800, container.clientHeight);
    } else {
      canvas.width = 600;
      canvas.height = 800;
    }

    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate visible nodes first
    const visibleInputNodes = Math.min(INPUT_NODES, MAX_VISIBLE_NODES);
    const visibleHiddenNodes = Math.min(hiddenNodes, MAX_VISIBLE_NODES);
    const inputStep = Math.max(1, Math.floor(INPUT_NODES / visibleInputNodes));
    const hiddenStep = Math.max(1, Math.floor(hiddenNodes / visibleHiddenNodes));
    
    // Calculate total height needed for nodes
    const totalNodesHeight = visibleInputNodes * VERTICAL_SPACING;
    
    // Calculate Y positions to center vertically with more space for labels
    const inputY = TOP_PADDING + (totalNodesHeight / 2);
    const hiddenY = inputY;
    const outputY = inputY;

    const totalWidth = LAYER_SPACING * 2;
    const startX = (canvas.width - totalWidth) / 2;

    const inputX = startX;
    const hiddenX = inputX + LAYER_SPACING;
    const outputX = hiddenX + LAYER_SPACING;

    // Draw connections if weights are available
    if (weights1?.length === INPUT_NODES && weights2?.length === hiddenNodes) {
      // Draw background connections
      ctx.globalAlpha = CONNECTION_OPACITY_BACKGROUND;

      // Draw connections between input and hidden layer
      for (let i = 0; i < INPUT_NODES; i += inputStep * 2) {
        const startY = inputY + ((i / inputStep) - visibleInputNodes / 2) * VERTICAL_SPACING;

        for (let j = 0; j < hiddenNodes; j += hiddenStep * 2) {
          if (weights1[i] && weights1[i][j] !== undefined) {
            const endY = hiddenY + ((j / hiddenStep) - visibleHiddenNodes / 2) * VERTICAL_SPACING;
            const weight = weights1[i][j];

            ctx.beginPath();
            ctx.moveTo(inputX, startY);
            ctx.lineTo(hiddenX, endY);
            ctx.strokeStyle = weight > 0 ? '#4338ca' : '#dc2626';
            ctx.lineWidth = Math.abs(weight) * CONNECTION_SCALE;
            ctx.stroke();
          }
        }
      }

      // Draw foreground connections
      ctx.globalAlpha = CONNECTION_OPACITY_FOREGROUND;

      // Draw main visible connections
      for (let i = 0; i < visibleInputNodes; i++) {
        const inputIdx = i * inputStep;
        const startY = inputY + (i - visibleInputNodes / 2) * VERTICAL_SPACING;

        for (let j = 0; j < visibleHiddenNodes; j++) {
          const hiddenIdx = j * hiddenStep;
          if (weights1[inputIdx] && weights1[inputIdx][hiddenIdx] !== undefined) {
            const endY = hiddenY + (j - visibleHiddenNodes / 2) * VERTICAL_SPACING;
            const weight = weights1[inputIdx][hiddenIdx];

            ctx.beginPath();
            ctx.moveTo(inputX, startY);
            ctx.lineTo(hiddenX, endY);
            ctx.strokeStyle = weight > 0 ? '#4338ca' : '#dc2626';
            ctx.lineWidth = Math.abs(weight) * CONNECTION_SCALE;
            ctx.stroke();
          }
        }
      }

      // Draw connections to output layer
      for (let i = 0; i < visibleHiddenNodes; i++) {
        const hiddenIdx = i * hiddenStep;
        const startY = hiddenY + (i - visibleHiddenNodes / 2) * VERTICAL_SPACING;

        for (let j = 0; j < OUTPUT_NODES; j++) {
          if (weights2[hiddenIdx] && weights2[hiddenIdx][j] !== undefined) {
            const endY = outputY + (j - OUTPUT_NODES / 2) * VERTICAL_SPACING * 1.5;
            const weight = weights2[hiddenIdx][j];

            ctx.beginPath();
            ctx.moveTo(hiddenX, startY);
            ctx.lineTo(outputX, endY);
            ctx.strokeStyle = weight > 0 ? '#4338ca' : '#dc2626';
            ctx.lineWidth = Math.abs(weight) * CONNECTION_SCALE;
            ctx.stroke();
          }
        }
      }

      // Reset opacity for nodes
      ctx.globalAlpha = 1.0;
    }

    // Draw nodes with a subtle shadow effect
    const drawNode = (x: number, y: number, label?: string, isInputNode: boolean = false) => {
      // Draw shadow
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fill();

      // Draw node
      ctx.beginPath();
      ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (label) {
        ctx.fillStyle = '#374151';
        ctx.font = '11px system-ui';
        ctx.textAlign = isInputNode ? 'right' : 'left';
        const labelX = isInputNode ? x - NODE_RADIUS * 2 : x + NODE_RADIUS * 2;
        ctx.fillText(label, labelX, y + 4);
      }
    };

    // Draw nodes for each layer
    // Draw input layer nodes
    for (let i = 0; i < visibleInputNodes; i++) {
      const y = inputY + (i - visibleInputNodes / 2) * VERTICAL_SPACING;
      const nodeIndex = i * inputStep;
      drawNode(inputX, y, nodeIndex.toString(), true);
    }

    // Draw hidden layer nodes
    for (let i = 0; i < visibleHiddenNodes; i++) {
      const y = hiddenY + (i - visibleHiddenNodes / 2) * VERTICAL_SPACING;
      const nodeIndex = Math.floor(i * (hiddenNodes / visibleHiddenNodes));
      drawNode(hiddenX, y, nodeIndex.toString());
    }

    // Draw output layer nodes with more spacing
    for (let i = 0; i < OUTPUT_NODES; i++) {
      const y = outputY + (i - OUTPUT_NODES / 2) * VERTICAL_SPACING * 1.5;
      drawNode(outputX, y, i.toString());
    }

    // Draw layer labels
    const drawLayerLabel = (x: number, y: number, mainText: string, subText: string, isInputLayer: boolean = false) => {
      ctx.textAlign = isInputLayer ? 'right' : 'left';
      const labelX = isInputLayer ? x - 100 : x + 100;
      
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 13px system-ui';
      ctx.fillText(mainText, labelX, y - 10);
      ctx.font = '12px system-ui';
      ctx.fillText(subText, labelX, y + 10);
    };

    // Draw labels next to their respective layers
    drawLayerLabel(inputX, inputY, 'Input Layer', `(${INPUT_NODES} nodes)`, true);
    drawLayerLabel(outputX, outputY, 'Output Layer', '(10 nodes)');

    // Draw hidden layer label at the bottom
    ctx.textAlign = 'center';
    const hiddenLabelY = canvas.height - 50;
    ctx.font = 'bold 13px system-ui';
    ctx.fillText('Hidden Layer', hiddenX, hiddenLabelY);
    ctx.font = '12px system-ui';
    ctx.fillText(`(${hiddenNodes} nodes)`, hiddenX, hiddenLabelY + 20);
  };

  // Set up resize observer
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      drawNetwork();
    });
    
    if (canvasRef.current?.parentElement) {
      observer.observe(canvasRef.current.parentElement);
    }

    return () => observer.disconnect();
  }, []);

  // Draw network when props change
  useEffect(() => {
    if (weights1 && weights2) {
      console.log('Network weights updated:', {
        sample_weights1: weights1[0].slice(0, 3),
        sample_weights2: weights2[0].slice(0, 3)
      });
      drawNetwork();
    }
  }, [weights1, weights2, biases1, biases2, hiddenNodes]);

  if (!weights1 || !weights2 || !biases1 || !biases2) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Initializing network...</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[800px] bg-white"
    />
  );
}
