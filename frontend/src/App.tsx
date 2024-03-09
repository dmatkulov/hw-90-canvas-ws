import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IncomingMessage, Pixel } from './types';

function App() {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [newPixels, setNewPixels] = useState<Pixel | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/canvas');

    ws.current.addEventListener('close', () => console.log('ws closed'));

    ws.current.addEventListener('message', (event) => {
      const decodedDraw = JSON.parse(event.data) as IncomingMessage;

      if (decodedDraw.type === 'DRAW_HISTORY') {
        setPixels((prevPixels) => [...prevPixels, ...decodedDraw.payload]);
      }

      if (decodedDraw.type === 'DRAW_PIXELS') {
        setPixels((prevState) => [...prevState, decodedDraw.payload]);
      }
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    contextRef.current = context;

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendDrawing = () => {
    if (!ws.current) return;

    ws.current.send(
      JSON.stringify({
        type: 'NEW_PIXELS',
        payload: newPixels,
      }),
    );
  };

  const startDrawing = () => {
    if (!contextRef.current) return;

    contextRef.current.beginPath();
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (!contextRef.current) return;

    setIsDrawing(false);
    contextRef.current.beginPath();
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;

    const { offsetX, offsetY } = nativeEvent;

    const context = contextRef.current;

    if (!context) return;

    context.lineWidth = 1;
    context.beginPath();
    context.lineTo(offsetX, offsetY);
    context.stroke();
    context.moveTo(offsetX, offsetY);
    setNewPixels({ x: offsetX, y: offsetY });
    sendDrawing();
  };

  const drawOnStartup = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;

    const context = contextRef.current;
    context.beginPath();

    pixels.forEach((pixel) => {
      if (pixel) {
        if (context) {
          context.lineTo(pixel.x, pixel.y);
        }
      }
    });
    context.stroke();
  }, [pixels]);

  useEffect(() => {
    void drawOnStartup();
  }, [drawOnStartup]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <canvas
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        ref={canvasRef}
        width="1024"
        height="768"
        style={{ border: '1px solid black' }}
      />
    </div>
  );
}

export default App;
