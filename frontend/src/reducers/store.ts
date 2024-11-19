import { combineReducers, configureStore } from '@reduxjs/toolkit';
import * as logDataSlice from './logDataSlice';
import * as mainViewSlice from './mainViewModelSlice';

const reducer = {
  logData: logDataSlice.reducer,
  mainView: mainViewSlice.reducer,
};

export const store = configureStore({
  reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat([
      logDataSlice.debounceReflowMiddleware,
      logDataSlice.debounceSearchMiddleware,
    ]),
  devTools: true,
});

const rootReducer = combineReducers(reducer);
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
