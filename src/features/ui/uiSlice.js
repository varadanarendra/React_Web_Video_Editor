import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  playhead: {
    time: 0,
    playing: false,
  },
  zoom: 1,
  grid: 0.25, // seconds
  selection: null, // { id, type: 'segment' | 'overlay' }
  timelineViewport: {
    start: 0,
    end: 30, // default 30 seconds view
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setPlayheadTime: (state, action) => {
      state.playhead.time = Math.max(0, action.payload);
    },
    setPlaying: (state, action) => {
      state.playhead.playing = action.payload;
    },
    updatePlayhead: (state, action) => {
      state.playhead = { ...state.playhead, ...action.payload };
    },
    setZoom: (state, action) => {
      state.zoom = Math.max(0.1, Math.min(10, action.payload));
    },
    adjustZoom: (state, action) => {
      const delta = action.payload;
      state.zoom = Math.max(0.1, Math.min(10, state.zoom + delta));
    },
    setGrid: (state, action) => {
      state.grid = action.payload;
    },
    setSelection: (state, action) => {
      state.selection = action.payload;
    },
    clearSelection: (state) => {
      state.selection = null;
    },
    setTimelineViewport: (state, action) => {
      state.timelineViewport = { ...state.timelineViewport, ...action.payload };
    },
    fitTimelineToContent: (state, action) => {
      // This will be called with segments data to compute min/max
      const { minStart, maxEnd } = action.payload;
      if (minStart !== undefined && maxEnd !== undefined) {
        state.timelineViewport.start = Math.max(0, minStart);
        state.timelineViewport.end = Math.max(30, maxEnd + 5); // Add 5s padding
      }
    },
  },
});

export const {
  setPlayheadTime,
  setPlaying,
  updatePlayhead,
  setZoom,
  adjustZoom,
  setGrid,
  setSelection,
  clearSelection,
  setTimelineViewport,
  fitTimelineToContent,
} = uiSlice.actions;

// Selectors
export const selectPlayhead = (state) => state.ui.playhead;
export const selectZoom = (state) => state.ui.zoom;
export const selectGrid = (state) => state.ui.grid;
export const selectSelection = (state) => state.ui.selection;
export const selectTimelineViewport = (state) => state.ui.timelineViewport;

export default uiSlice.reducer;

