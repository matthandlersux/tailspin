import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ServerData, addLine } from './sharedActions';

export interface LogDataState {
  files: Record<string, string[]>;
}

const initialState: LogDataState = {
  files: {},
};

export const logDataSlice = createSlice({
  name: 'logData',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(addLine, (state, { payload: { data } }: PayloadAction<ServerData>) => {
      state.files[data.file_path] = [...(state.files[data.file_path] ?? []), data.line];
    });
  },
});

export const {} = logDataSlice.actions;
export const reducer = logDataSlice.reducer;
