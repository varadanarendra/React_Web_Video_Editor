import { createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Async thunks for segment operations
 * Currently using synchronous actions, but this file is here for future async operations
 * like loading video metadata, processing files, etc.
 */

// Example: Load video metadata asynchronously
export const loadVideoMetadata = createAsyncThunk(
  'segments/loadVideoMetadata',
  async (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
        URL.revokeObjectURL(video.src);
      };
    });
  }
);

