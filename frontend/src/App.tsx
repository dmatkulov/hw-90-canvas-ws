import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IncomingMessage, Pixel } from './types';

function App() {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [history, setHistory] = useState<Pixel[]>([]);
  const [newPixels, setNewPixels] = useState<Pixel | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/canvas');

    ws.current.addEventListener('close', () => console.log('ws closed'));

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    contextRef.current = context;

    ws.current.addEventListener('message', (event) => {
      const decodedDraw = JSON.parse(event.data) as IncomingMessage;

      if (decodedDraw.type === 'DRAW_HISTORY') {
        setHistory((prevPixels) => [...prevPixels, ...decodedDraw.payload]);
      }

      if (decodedDraw.type === 'DRAW_PIXELS') {
        setPixels((prevState) => [...prevState, decodedDraw.payload]);
      }
    });

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

  const finishDrawing = () => {
    sendDrawing();
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contextRef.current) return;

    const context = contextRef.current;
    if (!context) return;

    const { offsetX, offsetY } = nativeEvent;

    context.fillRect(offsetX, offsetY, 2, 2);
    setNewPixels({ x: offsetX, y: offsetY });
  };

  const drawPixels = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;

    const context = contextRef.current;

    pixels.forEach((pixel) => {
      if (pixel) {
        if (context) {
          context.fillRect(pixel.x, pixel.y, 2, 2);
        }
      }
    });
  }, [pixels]);

  const drawOnStartup = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;

    const context = contextRef.current;

    history.forEach((pixel) => {
      if (pixel) {
        if (context) {
          context.fillRect(pixel.x, pixel.y, 2, 2);
        }
      }
    });
  }, [history]);

  useEffect(() => {
    void drawOnStartup();
  }, [drawOnStartup]);

  useEffect(() => {
    void drawPixels();
  }, [drawPixels]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <canvas
        onMouseDown={draw}
        onMouseUp={finishDrawing}
        ref={canvasRef}
        width="1024"
        height="768"
        style={{ border: '1px solid black' }}
      />
    </div>
  );
}

export default App;
