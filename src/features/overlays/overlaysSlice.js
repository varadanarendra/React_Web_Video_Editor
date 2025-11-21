import { createSlice } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

const initialState = {
  items: [],
};

const overlaysSlice = createSlice({
  name: 'overlays',
  initialState,
  reducers: {
    addOverlay: (state, action) => {
      const { segmentIds, startTime = 0, duration, x = 0.1, y = 0.1, width = 0.3, height = 0.2, text = 'Overlay', type = 'text' } = action.payload;
      const newOverlay = {
        id: nanoid(),
        segmentIds: segmentIds || [],
        startTime,
        duration: duration || 5,
        x,
        y,
        width,
        height,
        text,
        type,
      };
      state.items.push(newOverlay);
    },
    updateOverlay: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.items.findIndex(overlay => overlay.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updates };
      }
    },
    moveOverlay: (state, action) => {
      const { id, newStartTime } = action.payload;
      const index = state.items.findIndex(overlay => overlay.id === id);
      if (index !== -1) {
        state.items[index].startTime = Math.max(0, newStartTime);
      }
    },
    resizeOverlay: (state, action) => {
      const { id, newStartTime, newDuration } = action.payload;
      const index = state.items.findIndex(overlay => overlay.id === id);
      if (index !== -1) {
        if (newStartTime !== undefined) {
          state.items[index].startTime = Math.max(0, newStartTime);
        }
        if (newDuration !== undefined) {
          state.items[index].duration = Math.max(0.1, newDuration);
        }
      }
    },
    updateOverlayGeometry: (state, action) => {
      const { id, x, y, width, height } = action.payload;
      const index = state.items.findIndex(overlay => overlay.id === id);
      if (index !== -1) {
        if (x !== undefined) state.items[index].x = Math.max(0, Math.min(1, x));
        if (y !== undefined) state.items[index].y = Math.max(0, Math.min(1, y));
        if (width !== undefined) state.items[index].width = Math.max(0.05, Math.min(1, width));
        if (height !== undefined) state.items[index].height = Math.max(0.05, Math.min(1, height));
      }
    },
    deleteOverlay: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(overlay => overlay.id !== id);
    },
    assignOverlayToSegments: (state, action) => {
      const { id, segmentIds } = action.payload;
      const index = state.items.findIndex(overlay => overlay.id === id);
      if (index !== -1) {
        state.items[index].segmentIds = segmentIds;
      }
    },
  },
});

export const { addOverlay, updateOverlay, moveOverlay, resizeOverlay, updateOverlayGeometry, deleteOverlay, assignOverlayToSegments } = overlaysSlice.actions;

// Selectors
export const selectAllOverlays = (state) => state.overlays.items;
export const selectOverlayById = (state, id) => state.overlays.items.find(overlay => overlay.id === id);
export const selectOverlaysForSegment = (state, segmentId) =>
  state.overlays.items.filter(overlay => overlay.segmentIds.includes(segmentId));

export default overlaysSlice.reducer;

