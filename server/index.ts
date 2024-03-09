import expressWs from 'express-ws';
import express from 'express';
import cors from 'cors';
import { ActiveConnections, IncomingPixel, Pixel } from './types';

const app = express();

expressWs(app);

const port = 8000;
app.use(cors());

const router = express.Router();

const activeConnections: ActiveConnections = {};

const history: Pixel[] = [];
router.ws('/canvas', (ws, _req) => {
  const id = crypto.randomUUID();
  console.log('Client connected id= ', id);

  activeConnections[id] = ws;

  ws.send(JSON.stringify({ type: 'DRAW_HISTORY', payload: history }));

  ws.on('message', (message) => {
    console.log(message.toString());

    const parsedPixels = JSON.parse(message.toString()) as IncomingPixel;

    history.push(parsedPixels.payload);

    if (parsedPixels.type === 'NEW_PIXELS') {
      Object.values(activeConnections).forEach((connection) => {
        const outgoing = {
          type: 'DRAW_PIXELS',
          payload: parsedPixels.payload,
        };
        connection.send(JSON.stringify(outgoing));
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected, ', id);

    delete activeConnections[id];
  });
});

app.use(router);

app.listen(port, () => {
  console.log('Server online on port ', port);
});
