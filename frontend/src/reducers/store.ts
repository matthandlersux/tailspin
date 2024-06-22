import { configureStore } from '@reduxjs/toolkit';
import * as logDataSlice from './logDataSlice';
import * as mainViewSlice from './mainViewModelSlice';

export const store = configureStore({
  reducer: {
    logData: logDataSlice.reducer,
    mainView: mainViewSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
