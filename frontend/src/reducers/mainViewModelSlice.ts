import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ServerData, addLine } from './sharedActions';
import { uniq } from 'lodash';

export interface MainViewState {
  files: string[];
  currentIndex: number;
}

const initialState: MainViewState = {
  files: [],
  currentIndex: 0,
};

export const logDataSlice = createSlice({
  name: 'mainView',
  initialState,
  reducers: {
    changeIndex: (state, { payload }: PayloadAction<number>) => {
      state.currentIndex = payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(addLine, (state, { payload: { data } }: PayloadAction<ServerData>) => {
      state.files = uniq([...state.files, data.file_path]);
    });
  },
});

export const { changeIndex } = logDataSlice.actions;
export const reducer = logDataSlice.reducer;
