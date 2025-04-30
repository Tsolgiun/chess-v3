import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EvaluatedPosition } from '../../lib/chess/types/Position';
import { Classification } from '../../lib/chess/classification';

interface EvaluationGraphProps {
  positions: EvaluatedPosition[];
  currentMoveIndex: number;
  boardFlipped?: boolean;
  onMoveSelect?: (moveIndex: number) => void;
}

const GraphContainer = styled.div`
  width: 100%;
  height: 80px;
  position: relative;
  margin-top: 10px;
  cursor: pointer;
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
`;

// Classification colors
const classificationColors: Record<Classification, string> = {
  [Classification.BRILLIANT]: '#1baca6',
  [Classification.GREAT]: '#5c8bb0',
  [Classification.BEST]: '#4caf50',
  [Classification.EXCELLENT]: '#8bc34a',
  [Classification.GOOD]: '#cddc39',
  [Classification.INACCURACY]: '#ffc107',
  [Classification.MISTAKE]: '#ff9800',
  [Classification.BLUNDER]: '#f44336',
  [Classification.BOOK]: '#9c27b0',
  [Classification.FORCED]: '#607d8b'
};

const EvaluationGraph: React.FC<EvaluationGraphProps> = ({
  positions,
  currentMoveIndex,
  boardFlipped = false,
  onMoveSelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Helper function to get semi-transparent color
  const getSemiTransparentColor = (color: string, opacity: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Helper function to determine if a position is white's or black's move
  const getMovedPlayer = (fen: string): 'white' | 'black' => {
    return fen.includes(" b ") ? 'white' : 'black';
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas || positions.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const graphHeight = canvas.height;
    const graphWidth = canvas.width;
    const maxEval = 1100; // Max centipawn value
    const cpPerPixel = maxEval / (graphHeight / 2);

    // Clear canvas
    ctx.clearRect(0, 0, graphWidth, graphHeight);

    // Calculate bar widths
    const baseBarWidth = Math.floor(graphWidth / positions.length);
    const remainderPixels = graphWidth - (baseBarWidth * positions.length);
    const extraWidthPerBar = remainderPixels / positions.length;

    let cumulativeWidth = 0;

    // Draw bars for each position
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      const topLine = position.topLines.find(line => line.id === 1);
      const evaluation = topLine?.evaluation;
      const currentBarWidth = baseBarWidth + Math.floor((i + 1) * extraWidthPerBar) - Math.floor(i * extraWidthPerBar);
      const classification = position.classification;
      const classificationColor = classification ? classificationColors[classification] : '#4caf50';

      // Draw background
      ctx.fillStyle = i === hoverIndex ? '#555555' : '#000000';
      ctx.fillRect(cumulativeWidth, 0, currentBarWidth, graphHeight);

      // Draw evaluation bar
      if (evaluation) {
        if (evaluation.type === 'mate') {
          const movedPlayer = getMovedPlayer(position.fen);

          if (evaluation.value === 0) {
            // Checkmate
            ctx.fillStyle = movedPlayer === 'white' ? '#ffffff' : '#000000';
          } else {
            // Mate in N
            if (i === currentMoveIndex && i === hoverIndex) {
              ctx.fillStyle = '#4cef50';
            } else if (i === currentMoveIndex) {
              ctx.fillStyle = '#8cef90';
            } else if (i === hoverIndex) {
              ctx.fillStyle = evaluation.value >= 0 ? '#bbbbbb' : '#555555';
            } else {
              ctx.fillStyle = evaluation.value >= 0 ? '#ffffff' : '#000000';
            }
          }
          ctx.fillRect(cumulativeWidth, 0, currentBarWidth, graphHeight);
        } else if (evaluation.type === 'cp') {
          // Centipawn evaluation
          const height = graphHeight / 2 + evaluation.value / cpPerPixel;
          ctx.fillStyle = i === hoverIndex ? '#dddddd' : '#ffffff';

          if (!boardFlipped) {
            ctx.fillRect(cumulativeWidth, graphHeight - height, currentBarWidth, height);
          } else {
            ctx.fillRect(cumulativeWidth, 0, currentBarWidth, height);
          }
        }
      }

      // Highlight current move and hovered move
      if (i === currentMoveIndex && i === hoverIndex) {
        ctx.fillStyle = classification ? getSemiTransparentColor(classificationColor, 0.8) : getSemiTransparentColor('#000000', 0.2);
        ctx.fillRect(cumulativeWidth, 0, currentBarWidth, graphHeight);
      } else if (i === currentMoveIndex) {
        ctx.fillStyle = classification ? getSemiTransparentColor(classificationColor, 0.5) : getSemiTransparentColor('#000000', 0.2);
        ctx.fillRect(cumulativeWidth, 0, currentBarWidth, graphHeight);
      } else if (i === hoverIndex) {
        ctx.fillStyle = classification ? getSemiTransparentColor(classificationColor, 0.5) : getSemiTransparentColor('#000000', 0.2);
        ctx.fillRect(cumulativeWidth, 0, currentBarWidth, graphHeight);
      }

      cumulativeWidth += currentBarWidth;
    }

    // Draw midline
    ctx.beginPath();
    ctx.moveTo(0, graphHeight / 2);
    ctx.lineTo(graphWidth, graphHeight / 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ff5555';
    ctx.stroke();

    // Draw classification icon for hovered move
    if (hoverIndex !== null) {
      const position = positions[hoverIndex];
      const classification = position.classification;
      
      if (classification) {
        // Draw classification tooltip
        const tooltipWidth = 100;
        const tooltipHeight = 30;
        const tooltipX = Math.min(Math.max(mousePosition.x, tooltipWidth / 2), graphWidth - tooltipWidth / 2) - tooltipWidth / 2;
        const tooltipY = mousePosition.y - tooltipHeight - 10;
        
        // Draw tooltip background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);
        ctx.fill();
        ctx.stroke();
        
        // Draw classification text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          classification.charAt(0).toUpperCase() + classification.slice(1),
          tooltipX + tooltipWidth / 2,
          tooltipY + tooltipHeight / 2
        );
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawGraph();
      }
    };

    // Initial resize
    resizeCanvas();

    // Add resize listener
    window.addEventListener('resize', resizeCanvas);

    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    drawGraph();
  }, [positions, currentMoveIndex, boardFlipped, hoverIndex, mousePosition]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || positions.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });

    // Calculate which move is being hovered
    const graphWidth = canvas.width;
    const baseBarWidth = Math.floor(graphWidth / positions.length);
    const remainderPixels = graphWidth - (baseBarWidth * positions.length);
    const extraWidthPerBar = remainderPixels / positions.length;

    let cumulativeWidth = 0;
    let newHoverIndex = null;

    for (let i = 0; i < positions.length; i++) {
      const currentBarWidth = baseBarWidth + Math.floor((i + 1) * extraWidthPerBar) - Math.floor(i * extraWidthPerBar);
      if (x < cumulativeWidth + currentBarWidth) {
        newHoverIndex = i;
        break;
      }
      cumulativeWidth += currentBarWidth;
    }

    setHoverIndex(newHoverIndex);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const handleClick = () => {
    if (hoverIndex !== null && onMoveSelect) {
      onMoveSelect(hoverIndex);
    }
  };

  return (
    <GraphContainer>
      <Canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
    </GraphContainer>
  );
};

export default EvaluationGraph;
