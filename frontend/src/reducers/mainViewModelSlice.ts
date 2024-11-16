import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ServerData, addLine } from './sharedActions';
import { uniq } from 'lodash';
import { findCommonPrefix } from '../utils/filename';

export interface MainViewState {
  files: string[];
  currentIndex: 'combined' | number;
  nameMapping: Record<string, string>;
}

const initialState: MainViewState = {
  files: [],
  nameMapping: {},
  currentIndex: 0,
};

export const logDataSlice = createSlice({
  name: 'mainView',
  initialState,
  reducers: {
    changeIndex: (state, { payload }: PayloadAction<'combined' | number>) => {
      state.currentIndex = payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(addLine, (state, { payload: { data } }: PayloadAction<ServerData>) => {
      state.files = uniq([...state.files, data.file_path]).sort();
      const prefix = findCommonPrefix(state.files);
      state.nameMapping = Object.fromEntries(state.files.map(f => [f, f.slice(prefix.length)]));
    });
  },
});

export const { changeIndex } = logDataSlice.actions;
export const reducer = logDataSlice.reducer;
