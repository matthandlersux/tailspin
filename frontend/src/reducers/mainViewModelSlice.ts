import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ServerData, addLine, search } from './sharedActions';
import { keyBy, uniq } from 'lodash';
import { findCommonPrefix } from '../utils/filename';

export type FileData = {
  name: string;
  lines: number;
};

export interface MainViewState {
  files: FileData[];
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
      const fileNames = uniq([...state.files.map(f => f.name), data.file_path]).sort();
      if (fileNames.length !== state.files.length) {
        const existingMap = keyBy(state.files, f => f.name);
        state.files = fileNames.map(f => ({ name: f, lines: existingMap[f]?.lines ?? 1 }));
      } else {
        state.files = state.files.map(f => {
          return { ...f, lines: f.name === data.file_path ? f.lines + 1 : f.lines };
        });
      }

      const prefix = findCommonPrefix(fileNames);
      state.nameMapping = Object.fromEntries(fileNames.map(f => [f, f.slice(prefix.length)]));
    });
    builder.addCase(search, (state, { payload: query }: PayloadAction<string>) => {
      query.trim().length ? (state.searchQuery = query) : (state.searchQuery = undefined);
    });
  },
});

export const { changeIndex } = logDataSlice.actions;
export const reducer = logDataSlice.reducer;
