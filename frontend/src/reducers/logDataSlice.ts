import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ServerData, addLine } from './sharedActions';

export interface LogEntry {
  file: string;
  line: string;
}

export interface LogDataState {
  all: LogEntry[];
  files: Record<string, string[]>;
}

const initialState: LogDataState = {
  all: [],
  files: {},
};

export const logDataSlice = createSlice({
  name: 'logData',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(addLine, (state, { payload: { data } }: PayloadAction<ServerData>) => {
      state.all = [...state.all, { file: data.file_path, line: data.line }];
      state.files[data.file_path] = [...(state.files[data.file_path] ?? []), data.line];
    });
  },
});

export const {} = logDataSlice.actions;
export const reducer = logDataSlice.reducer;
