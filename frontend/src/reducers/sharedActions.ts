import { createAction } from '@reduxjs/toolkit';

export type ServerData = {
  data: {
    line: string;
    line_number: number;
    file_path: string;
  };
};

export const addLine = createAction<ServerData>('websocket/addLine');
export const search = createAction<string>('focusBuffer/search');
