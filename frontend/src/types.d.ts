export interface Pixel {
  x: number;
  y: number;
  color: 'black';
}

export interface IncomingPixels {
  type: 'DRAW_PIXELS';
  payload: Pixel[];
}
