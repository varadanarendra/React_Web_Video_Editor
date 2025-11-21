import { configureStore } from '@reduxjs/toolkit';
import segmentsReducer from '../features/segments/segmentsSlice';
import overlaysReducer from '../features/overlays/overlaysSlice';
import transitionsReducer from '../features/transitions/transitionsSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    segments: segmentsReducer,
    overlays: overlaysReducer,
    transitions: transitionsReducer,
    ui: uiReducer,
  },
});

