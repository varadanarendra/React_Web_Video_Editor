import { createSlice } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

const initialState = {
  items: [],
};

const transitionsSlice = createSlice({
  name: 'transitions',
  initialState,
  reducers: {
    addTransition: (state, action) => {
      const { fromSegmentId, toSegmentId, type = 'crossfade', duration = 0.5, easing = 'ease-in-out' } = action.payload;
      const newTransition = {
        id: nanoid(),
        fromSegmentId,
        toSegmentId,
        type,
        duration,
        easing,
      };
      state.items.push(newTransition);
    },
    updateTransition: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.items.findIndex(trans => trans.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updates };
      }
    },
    deleteTransition: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(trans => trans.id !== id);
    },
  },
});

export const { addTransition, updateTransition, deleteTransition } = transitionsSlice.actions;

// Selectors
export const selectAllTransitions = (state) => state.transitions.items;
export const selectTransitionBetween = (state, fromSegmentId, toSegmentId) =>
  state.transitions.items.find(
    trans => trans.fromSegmentId === fromSegmentId && trans.toSegmentId === toSegmentId
  );

export default transitionsSlice.reducer;

