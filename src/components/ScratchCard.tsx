import React, { useRef, useEffect, useState } from 'react';

interface ScratchCardProps {
  width: number;
  height: number;
  onReveal: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({ width, height, onReveal, children, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Fill with scratch layer
    ctx.fillStyle = '#CCCCCC'; // Silver scratch color
    ctx.fillRect(0, 0, width, height);
    
    // Add "Scratch Me" text
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GOSOK DISINI!', width / 2, height / 2);

    // Add some noise/texture
    for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

  }, [width, height]);

  const getMousePos = (canvas: HTMLCanvasElement, evt: MouseEvent | TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in evt) {
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    } else {
      clientX = (evt as MouseEvent).clientX;
      clientY = (evt as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isRevealed) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getMousePos(canvas, e.nativeEvent);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fill();

    checkReveal(ctx, width, height);
  };

  const checkReveal = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Check every 10th pixel to save performance
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    
    for (let i = 3; i < pixels.length; i += 40) { // Check alpha channel every 10 pixels
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    const totalPixels = pixels.length / 40;
    const percentage = (transparentPixels / totalPixels) * 100;

    if (percentage > 50) { // Reveal if > 50% scratched
      setIsRevealed(true);
      onReveal();
    }
  };

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Content underneath */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        {children}
      </div>
      
      {/* Scratch Layer */}
      {!isRevealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 cursor-pointer touch-none rounded-xl"
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onMouseMove={scratch}
          onTouchStart={() => setIsDrawing(true)}
          onTouchEnd={() => setIsDrawing(false)}
          onTouchMove={scratch}
        />
      )}
    </div>
  );
};
