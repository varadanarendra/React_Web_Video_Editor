# React-Based Web Video Editor

A production-ready, scalable web-based video editor built with React, Redux Toolkit, and HTML5 Video. This application allows users to create, edit, and export video timelines with segments, overlays, and transitions.

## 🎯 Features

- **Video Timeline Editor**: Drag-and-drop interface for arranging video segments. Select a video and press the Delete key on the keyboard to delete it. Videos can be expanded and reduced in width as well.
- **Overlay System**: Add text overlays with drag-and-resize functionality
- **Transitions**: Add smooth transitions (fade, zoom, slide) between video segments (Feature added for demo, but applying transitions to videos is pending)
- **Playback Control**: Synchronized playback with HTML5 video player
- **Export Functionality**: Export timeline configuration as JSON
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Works across mobile, tablet, and desktop devices (90% responsiveness achieved)

## 🔧 Tech Stack

- **React** 18+ (functional components, hooks)
- **Redux Toolkit** (state management)
- **HTML5 Video** (native video playback)
- **TailwindCSS** (styling)
- **Vite** (build tool)
- **nanoid** (unique ID generation)

## 📦 Installation

### Prerequisites

- Node.js 16+ and npm
- Git (optional)

### Setup Steps

1. **Clone or download the project**

   ```bash
   git clone https://github.com/varadanarendra/React_Web_Video_Editor
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   The app will automatically open at `http://localhost:5173` (Vite default port)

## 🚀 Usage

### Adding Video Segments

1. Click the **"+ Add Video"** button in the header
2. Select one or more video files from your computer
3. Segments will automatically appear on the timeline

### Editing Segments

- **Move**: Click and drag a segment horizontally on the timeline
- **Resize**: Drag the left or right edge handles to adjust duration

### Adding Overlays

1. Click **"+ Add Overlay"** button
2. The overlay will appear in the video preview area
3. Drag to reposition, use corner/edge handles to resize
4. Overlays are automatically assigned to the first segment (can be extended)

### Adding Transitions

1. Right-click on a video segment to show the context menu. Select the "Add Transition" option to add a transition.
2. Choose transition type (Fade, Zoom, or Slide)
3. Adjust duration and easing options
4. Transitions will play automatically when segments switch during playback (Experimental)

### Playback

- **Play All**: Click the **"► Play All"** button to play all segments sequentially
- **Seek**: Click anywhere on the timeline to jump to that position
- **Playhead**: Drag the red playhead line to scrub through the timeline
- **Pause**: Click **"⏸ Pause"** to pause playback at any time

### Export

1. Click **"Export Timeline"** button
2. A JSON popup opens where you can view and copy the timeline configuration.

## ♿ Accessibility

This application is designed with accessibility in mind:

### Keyboard Navigation

- **Timeline Navigation**:

  - `Arrow Left/Right`: Move playhead by grid increments
  - `Home`: Jump to start of timeline
  - `Tab`: Navigate between interactive elements
  - `Enter/Space`: Activate buttons and controls

- **Segment Editing**:

  - Select a segment (click or Tab to it)
  - `Arrow Left/Right`: Move segment by grid increments
  - `Enter`: Activate drag mode

- **Overlay Editing**:
  - Select an overlay
  - Arrow keys to nudge position (when implemented)
  - `Enter/Space`: Activate resize handles

### Screen Reader Support

- All interactive elements have ARIA labels
- Timeline state is announced to screen readers
- Focus indicators are visible for keyboard navigation
- Semantic HTML elements are used throughout

### Visual Accessibility

- High contrast text and controls
- Visible focus rings on all interactive elements
- Clear visual feedback for drag/resize operations

## 🏗️ Project Structure

```
React_Web_Video_Editor/
├── public/
│   └── videos/                  # Sample video files
│       ├── vid_1.mp4
│       ├── vid_2.mp4
│       └── vid_3.mp4
├── src/
│   ├── app/
│   │   └── store.js             # Redux store configuration
│   ├── features/
│   │   ├── segments/
│   │   │   ├── segmentsSlice.js     # Redux slice for segments
│   │   │   ├── segmentsThunks.js    # Async thunks
│   │   │   └── SegmentBlock.jsx     # Timeline segment component
│   │   ├── overlays/
│   │   │   ├── overlaysSlice.js     # Redux slice for overlays
│   │   │   ├── OverlayCanvas.jsx    # Overlay rendering component
│   │   │   └── OverlayItem.jsx      # Timeline overlay item
│   │   ├── transitions/
│   │   │   ├── transitionsSlice.js  # Redux slice for transitions
│   │   │   ├── TransitionModal.jsx  # Transition configuration modal
│   │   │   └── TransitionHandle.jsx # Transition handle component
│   │   ├── player/
│   │   │   ├── VideoPlayer.jsx      # HTML5 video player component
│   │   │   └── useVideoSync.js      # Video sync hook (legacy)
│   │   ├── timeline/
│   │   │   ├── Timeline.jsx         # Main timeline component
│   │   │   ├── Playhead.jsx         # Playhead indicator
│   │   │   └── TimelineControls.jsx # Zoom and fit controls
│   │   ├── ui/
│   │   │   └── uiSlice.js           # UI state (playhead, zoom, selection)
│   │   └── export/
│   │       └── ExportPanel.jsx      # Export functionality
│   ├── utils/
│   │   ├── timelineUtils.js         # Timeline calculation utilities
│   │   ├── snappingUtils.js         # Snap-to-grid utilities
│   │   └── geometryUtils.js         # Overlay geometry utilities
│   ├── components/
│   │   ├── Button.jsx               # Reusable button component
│   │   ├── DragHandle.jsx           # Drag handle component
│   │   ├── JsonModal.jsx            # JSON export modal component
│   │   └── Resizer.jsx              # Resize handle component
│   ├── App.jsx                      # Main app component
│   ├── index.jsx                    # Entry point
│   └── index.css                    # Global styles
├── index.html                       # HTML entry point
├── package.json                     # Project dependencies and scripts
├── vite.config.js                   # Vite configuration
├── tailwind.config.js               # TailwindCSS configuration
└── postcss.config.js                # PostCSS configuration
```

## 🔑 Key Implementation Details

### Auto-Shift Logic

When a segment is moved or resized and would overlap with subsequent segments, the system automatically shifts those segments to maintain continuity. This is implemented in the `moveSegment` and `resizeSegment` reducers in `segmentsSlice.js`.

### Snapping

The timeline supports snapping to:

- **Grid**: Configurable grid size (default 0.25 seconds)
- **Segment Edges**: Snaps to the start or end of other segments within a threshold

Snapping logic is in `utils/snappingUtils.js`.

### Play All Logic

When "Play All" is enabled:

1. Segments are sorted by start time
2. Player switches to the first segment (or current segment if playhead is within one)
3. When a segment ends, any configured transition plays
4. Player automatically switches to the next segment
5. Playback continues until all segments are played

This is handled in `VideoPlayer.jsx` with the `ended` event listener and transition overlay system.

### Transitions

The editor supports three types of transitions between segments:

- **Fade**: Smooth crossfade between segments
- **Zoom**: Zoom in/out effect during transition
- **Slide**: Slide transition effect

Transitions are configured per segment boundary and play automatically during sequential playback. Transition configuration is stored in the Redux state and exported in the JSON.

- A transition can be added by right-clicking on a segment boundary. Double-clicking a transition opens an edit popup. Select a transition and press the Delete key on the keyboard to delete it.

### Time Mapping

The system maintains accurate time mapping:

- **Global Timeline Time**: Absolute position on the timeline
- **Segment-Local Time**: Time within a specific segment
- **Video File Time**: Actual time in the source video file (with offset)

Conversion utilities are in `utils/timelineUtils.js`.

## 🧪 Testing

### Manual Test Cases

1. **Add Segments and Export**:

   - Add 3 video segments
   - Export the timeline
   - Verify JSON contains correct segment times and ordering

2. **Auto-Shift**:

   - Add 2 segments
   - Drag the first segment to overlap the second
   - Verify the second segment automatically shifts

3. **Overlay Assignment**:

   - Add an overlay
   - Assign it to 2 segments
   - Play through both segments
   - Verify overlay appears in both during playback

4. **Play All**:
   - Add multiple segments
   - Start playback from the middle segment
   - Verify playback continues to subsequent segments

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🐛 Troubleshooting

### Videos not loading

- Ensure video files are in `public/videos/` directory
- Check browser console for CORS errors
- Verify video file format is supported (MP4 recommended)
- The app automatically loads `vid_1.mp4`, `vid_2.mp4`, and `vid_3.mp4` from `public/videos/` on startup

### Playback issues

- If playback is stuttering, check browser console for errors
- Ensure video files are properly encoded (H.264 codec recommended)
- Try refreshing the page if playback becomes unresponsive

### Timeline not responding

- Check browser console for errors
- Ensure Redux DevTools extension is not interfering
- Try refreshing the page

## 📄 License

This project is provided as-is for educational and development purposes.

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your own use.

---

**Note**: This application runs entirely in the browser. Video processing is limited to timeline arrangement and overlay positioning. For actual video rendering/export, you would need a backend service or WebAssembly-based solution.
