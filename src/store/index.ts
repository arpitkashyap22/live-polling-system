import { configureStore } from '@reduxjs/toolkit';
import pollReducer from './pollSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    poll: pollReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;