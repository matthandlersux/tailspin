import { createSlice } from '@reduxjs/toolkit';
import type { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { ServerData, addLine } from './sharedActions';
import { RootState } from './store';

const REFLOW_TIMEOUT = 200;
let buffer: LogEntry[] = [];
let debounceHandle: NodeJS.Timeout | undefined;

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
  reducers: {
    /**
     * sometimes lots of data comes in quickly, so we debounce store -> UI updates into this action
     */
    reflowWithBuffer: state => {
      state.all = [...state.all, ...buffer];
      buffer.forEach(logEntry => {
        state.files[logEntry.file] = [...(state.files[logEntry.file] ?? []), logEntry.line];
      });
      buffer = [];
      debounceHandle = undefined;
    },
  },
  extraReducers: builder => {
    builder.addCase(addLine, (state, { payload: { data } }: PayloadAction<ServerData>) => {
      buffer.push({ file: data.file_path, line: data.line });
    });
  },
});

export const debounceReflowMiddleware: Middleware<{}, RootState> = store => next => action => {
  if (addLine.match(action)) {
    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(() => {
      store.dispatch(logDataSlice.actions.reflowWithBuffer());
    }, REFLOW_TIMEOUT);
  }
  return next(action);
};
export const reducer = logDataSlice.reducer;
