import { createSlice } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

const initialState = {
  items: [],
};

const segmentsSlice = createSlice({
  name: 'segments',
  initialState,
  reducers: {
    addSegment: (state, action) => {
      const { source, label, duration, startTime = 0, fileOffset = 0 } = action.payload;
      const newSegment = {
        id: nanoid(),
        source,
        label: label || `Video ${state.items.length + 1}`,
        startTime,
        duration,
        fileOffset,
      };
      state.items.push(newSegment);
      // Sort by startTime
      state.items.sort((a, b) => a.startTime - b.startTime);
    },
    updateSegment: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.items.findIndex(seg => seg.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updates };
        // Re-sort after update
        state.items.sort((a, b) => a.startTime - b.startTime);
      }
    },
    moveSegment: (state, action) => {
      const { id, newStartTime } = action.payload;
      const index = state.items.findIndex(seg => seg.id === id);
      if (index !== -1) {
        const segment = state.items[index];
        const oldStartTime = segment.startTime;
        const duration = segment.duration;
        
        segment.startTime = newStartTime;
        
        // Auto-shift: prevent overlaps by shifting subsequent segments
        for (let i = index + 1; i < state.items.length; i++) {
          const nextSegment = state.items[i];
          const overlapStart = Math.max(segment.startTime + duration, nextSegment.startTime);
          if (overlapStart < nextSegment.startTime + nextSegment.duration) {
            nextSegment.startTime = segment.startTime + duration;
          } else {
            break;
          }
        }
        
        // Re-sort
        state.items.sort((a, b) => a.startTime - b.startTime);
      }
    },
    resizeSegment: (state, action) => {
      const { id, newStartTime, newDuration } = action.payload;
      const index = state.items.findIndex(seg => seg.id === id);
      if (index !== -1) {
        const segment = state.items[index];
        
        if (newStartTime !== undefined) {
          segment.startTime = newStartTime;
        }
        if (newDuration !== undefined) {
          segment.duration = newDuration;
        }
        
        // Auto-shift subsequent segments if needed
        for (let i = index + 1; i < state.items.length; i++) {
          const nextSegment = state.items[i];
          const segmentEnd = segment.startTime + segment.duration;
          if (nextSegment.startTime < segmentEnd) {
            nextSegment.startTime = segmentEnd;
          } else {
            break;
          }
        }
        
        // Re-sort
        state.items.sort((a, b) => a.startTime - b.startTime);
      }
    },
    deleteSegment: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(seg => seg.id !== id);
    },
    reorderSegments: (state, action) => {
      // Reorder segments based on new order array
      const newOrder = action.payload;
      const sorted = newOrder.map(id => state.items.find(seg => seg.id === id)).filter(Boolean);
      state.items = sorted;
    },
  },
});

export const { addSegment, updateSegment, moveSegment, resizeSegment, deleteSegment, reorderSegments } = segmentsSlice.actions;

// Selectors
export const selectAllSegments = (state) => state.segments.items;
export const selectSegmentById = (state, id) => state.segments.items.find(seg => seg.id === id);
export const selectSegmentsByTime = (state, time) => 
  state.segments.items.filter(seg => 
    time >= seg.startTime && time < seg.startTime + seg.duration
  );

export default segmentsSlice.reducer;

