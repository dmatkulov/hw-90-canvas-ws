export interface Pixel {
  x: number;
  y: number;
}

export interface IncomingHistory {
  type: 'DRAW_PIXELS';
  payload: Pixel;
}

export interface IncomingPixels {
  type: 'DRAW_HISTORY';
  payload: Pixel[];
}

export interface IncomingWelcomeMessage {
  type: 'WELCOME';
  payload: string;
}

export type IncomingMessage =
  | IncomingPixels
  | IncomingWelcomeMessage
  | IncomingHistory;
