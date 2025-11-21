import React from 'react';
import { useSelector } from 'react-redux';
import { selectAllSegments } from '../segments/segmentsSlice';
import { selectAllOverlays } from '../overlays/overlaysSlice';
import { selectAllTransitions } from '../transitions/transitionsSlice';
import Button from '../../components/Button';

/**
 * Export Panel component - exports timeline data to JSON
 */
const ExportPanel = () => {
  const segments = useSelector(selectAllSegments);
  const overlays = useSelector(selectAllOverlays);
  const transitions = useSelector(selectAllTransitions);

  const handleExport = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      segments: segments.map(seg => ({
        id: seg.id,
        source: seg.source,
        label: seg.label,
        startTime: seg.startTime,
        duration: seg.duration,
        fileOffset: seg.fileOffset,
      })),
      overlays: overlays.map(overlay => ({
        id: overlay.id,
        segmentIds: overlay.segmentIds,
        startTime: overlay.startTime,
        duration: overlay.duration,
        x: overlay.x,
        y: overlay.y,
        width: overlay.width,
        height: overlay.height,
        text: overlay.text,
        type: overlay.type,
      })),
      transitions: transitions.map(trans => ({
        id: trans.id,
        fromSegmentId: trans.fromSegmentId,
        toSegmentId: trans.toSegmentId,
        type: trans.type,
        duration: trans.duration,
        easing: trans.easing,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'editor-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 sm:p-4 bg-gray-800 rounded-lg">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Export Timeline</h3>
      <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4">
        Export your timeline configuration as JSON. This includes all segments, overlays, and transitions.
      </p>
      <Button
        variant="primary"
        onClick={handleExport}
        ariaLabel="Export timeline to JSON file"
        className="w-full sm:w-auto"
      >
        Export Timeline
      </Button>
      <div className="mt-3 sm:mt-4 text-xs text-gray-400 space-y-1">
        <p>Segments: {segments.length}</p>
        <p>Overlays: {overlays.length}</p>
        <p>Transitions: {transitions.length}</p>
      </div>
    </div>
  );
};

export default ExportPanel;

