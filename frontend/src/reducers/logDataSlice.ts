import { createSlice } from '@reduxjs/toolkit';
import type { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { ServerData, addLine, search } from './sharedActions';
import { RootState } from './store';

const REFLOW_TIMEOUT = 200;
const SEARCH_REFLOW_TIMEOUT = 5;
const SEARCH_FAKE_ASYNC_LENGTH = 500;

let buffer: LogEntry[] = [];
let debounceHandle: NodeJS.Timeout | undefined;
let searchDebounceHandle: NodeJS.Timeout | undefined;
let searchInterval: NodeJS.Timeout | undefined;

export interface LogEntry {
  file: string;
  line: string;
}

export interface LogDataState {
  all: LogEntry[];
  files: Record<string, string[]>;
  searchBuffer: LogEntry[];
}

const initialState: LogDataState = {
  all: [],
  files: {},
  searchBuffer: [],
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
    clearSearch: state => {
      state.searchBuffer = [];
    },
    reflowSearchBuffer: (state, { payload }: PayloadAction<LogEntry[]>) => {
      state.searchBuffer = [...payload, ...state.searchBuffer];
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

export const debounceSearchMiddleware: Middleware<{}, RootState> = store => next => action => {
  if (search.match(action)) {
    clearTimeout(searchDebounceHandle);
    clearInterval(searchInterval);

    if (action.payload.trim().length === 0) {
      store.dispatch(logDataSlice.actions.clearSearch());
    } else {
      searchDebounceHandle = setTimeout(() => {
        store.dispatch(logDataSlice.actions.clearSearch());
        let startIndex = 0;
        searchInterval = setInterval(() => {
          const sliced = store
            .getState()
            .logData.all.slice(startIndex, startIndex + SEARCH_FAKE_ASYNC_LENGTH);
          if (sliced.length) {
            const found = sliced.filter(entry => {
              return entry.line.match(new RegExp(action.payload, 'i'));
            });
            startIndex += SEARCH_FAKE_ASYNC_LENGTH;
            store.dispatch(logDataSlice.actions.reflowSearchBuffer(found));
          } else {
            clearInterval(searchInterval);
          }
        }, SEARCH_REFLOW_TIMEOUT);
      }, REFLOW_TIMEOUT);
    }
  }
  return next(action);
};

export const reducer = logDataSlice.reducer;
