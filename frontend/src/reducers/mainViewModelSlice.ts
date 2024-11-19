import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ServerData, addLine, search } from './sharedActions';
import { uniq } from 'lodash';
import { findCommonPrefix } from '../utils/filename';

export interface MainViewState {
  files: string[];
  currentIndex: 'combined' | number;
  nameMapping: Record<string, string>;
  searchQuery: string | undefined;
}

const initialState: MainViewState = {
  files: [],
  nameMapping: {},
  currentIndex: 0,
  searchQuery: undefined,
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
    builder.addCase(search, (state, { payload: query }: PayloadAction<string>) => {
      query.trim().length ? (state.searchQuery = query) : (state.searchQuery = undefined);
    });
  },
});

export const { changeIndex } = logDataSlice.actions;
export const reducer = logDataSlice.reducer;
