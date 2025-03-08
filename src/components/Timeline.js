import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faPause, faStepForward, faStepBackward,
  faPlus, faVolumeUp, faClosedCaptioning, faVideo,
  faMusic, faVoicemail, faScissors, faTrash
} from '@fortawesome/free-solid-svg-icons';
import { DndContext, useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../contexts/ThemeContext';

// Styled components
const TimelineContainer = styled.div`
  background-color: var(--background-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  display: flex;
  flex-direction: column;
  height: 240px;
  position: relative;
  user-select: none;
`;

const TimelineHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
`;

const TimelineControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TimelineZoom = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ZoomInput = styled.input`
  width: 80px;
`;

const TimelineTracks = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 8px;
  position: relative;
`;

const TimelineRuler = styled.div`
  height: 24px;
  position: sticky;
  top: 0;
  background-color: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  margin-left: 140px;
  z-index: 5;
`;

const RulerTick = styled.div`
  position: absolute;
  top: 0;
  width: 1px;
  height: ${props => props.major ? '12px' : '8px'};
  background-color: var(--text-secondary);
  left: ${props => props.left}px;
`;

const RulerLabel = styled.div`
  position: absolute;
  top: 14px;
  font-size: 10px;
  color: var(--text-secondary);
  transform: translateX(-50%);
  left: ${props => props.left}px;
`;

const TrackContainer = styled.div`
  display: flex;
  height: 60px;
  min-height: 60px;
`;

const TrackLabel = styled.div`
  width: 140px;
  min-width: 140px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--background-color);
  border-radius: 4px 0 0 4px;
  color: var(--text-color);
  font-weight: 600;
`;

const TrackContent = styled.div`
  flex: 1;
  position: relative;
  background-color: var(--timeline-background);
  border-radius: 0 4px 4px 0;
  overflow: hidden;
`;

const ClipContainer = styled.div`
  position: absolute;
  height: 100%;
  top: 0;
  background-color: ${props => props.color || 'var(--primary-color)'};
  border-radius: 4px;
  left: ${props => props.left}px;
  width: ${props => props.width}px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  padding: 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  outline: ${props => props.isSelected ? '2px solid white' : 'none'};
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  }
`;

const Thumbnail = styled.img`
  height: 100%;
  width: auto;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.5;
  object-fit: cover;
`;

const ClipInfo = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
`;

const ClipTitle = styled.div`
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ClipDuration = styled.div`
  font-size: 10px;
  opacity: 0.8;
`;

const Playhead = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--accent-color);
  z-index: 10;
  left: ${props => props.position}px;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -6px;
    width: 0;
    height: 0;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 7px solid var(--accent-color);
  }
`;

const Button = styled.button`
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  border-radius: 4px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--primary-color);
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const IconButton = styled.button`
  background-color: transparent;
  border: none;
  color: var(--text-color);
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(128, 128, 128, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Format time display (seconds -> MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Sortable clip component
const SortableClip = ({ clip, left, width, color, isSelected, onClick, onResizeStart }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: clip.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'absolute',
    height: '100%',
    top: 0,
    backgroundColor: color || 'var(--primary-color)',
    borderRadius: '4px',
    left: `${left}px`,
    width: `${width}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    padding: '0 8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    outline: isSelected ? '2px solid white' : 'none',
    zIndex: isSelected ? 10 : 1
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onClick={(e) => onClick(e, clip.id)}
      {...attributes} 
      {...listeners}
    >
      {clip.thumbnailUrl && (
        <img 
          src={clip.thumbnailUrl} 
          alt="" 
          style={{
            height: '100%',
            width: 'auto',
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0.5,
            objectFit: 'cover'
          }}
        />
      )}
      
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflow: 'hidden'
      }}>
        <div style={{
          fontWeight: 600,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {clip.name}
        </div>
        <div style={{
          fontSize: '10px',
          opacity: 0.8
        }}>
          {formatTime(clip.duration)}
        </div>
      </div>
      
      {/* Resize handles */}
      <div 
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '8px',
          cursor: 'ew-resize'
        }}
        onMouseDown={(e) => onResizeStart(e, clip, 'start')}
      />
      
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '8px',
          cursor: 'ew-resize'
        }}
        onMouseDown={(e) => onResizeStart(e, clip, 'end')}
      />
    </div>
  );
};

// Timeline component
const Timeline = ({
  clips = [],
  subtitles = [],
  audioTracks = [],
  duration = 0,
  currentTime = 0,
  zoom = 1,
  onZoomChange,
  onTimeUpdate,
  onClipSelect,
  onClipMove,
  onClipResize,
  onClipDelete,
  onAddTrack,
  isPlaying,
  onPlayPause,
  onAddClip
}) => {
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [resizeStartPos, setResizeStartPos] = useState(0);
  const [resizeClip, setResizeClip] = useState(null);

  const timelineRef = useRef(null);
  const tracksRef = useRef(null);
  const playheadRef = useRef(null);
  const { theme } = useTheme();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // Base timeline settings
  const pxPerSecond = 100 * zoom; // Base px per second, multiplied by zoom level
  const timelineWidthPx = Math.max(1200, duration * pxPerSecond);
  
  // Generate ruler ticks based on zoom level
  const generateTicks = () => {
    const ticks = [];
    // Adjust tick interval based on zoom level
    let majorTickInterval;
    if (zoom <= 0.5) majorTickInterval = 60; // every minute
    else if (zoom <= 1) majorTickInterval = 30; // every 30 seconds
    else if (zoom <= 2) majorTickInterval = 10; // every 10 seconds
    else majorTickInterval = 5; // every 5 seconds
    
    const minorTickInterval = majorTickInterval / 5;
    
    for (let time = 0; time <= duration; time += minorTickInterval) {
      const isMajor = time % majorTickInterval === 0;
      ticks.push({
        time,
        isMajor,
        label: isMajor ? formatTime(time) : null
      });
    }
    
    return ticks;
  };
  
  // Convert timeline position to time
  const positionToTime = (positionX) => {
    if (!timelineRef.current) return 0;
    
    const trackRect = timelineRef.current.getBoundingClientRect();
    const trackContentLeft = trackRect.left + 140; // Account for label width
    
    const relativeX = positionX - trackContentLeft;
    return Math.max(0, relativeX / pxPerSecond);
  };
  
  // Convert time to timeline position
  const timeToPosition = (time) => {
    return time * pxPerSecond;
  };
  
  // Handle click on timeline to move playhead
  const handleTimelineClick = (e) => {
    if (isDragging || isResizing) return;
    
    const time = positionToTime(e.clientX);
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  };
  
  // Handle clip selection
  const handleClipClick = (e, clipId) => {
    e.stopPropagation();
    setSelectedClipId(clipId);
    
    if (onClipSelect) {
      onClipSelect(clipId);
    }
  };
  
  // Handle starting clip resize
  const handleResizeStart = (e, clip, direction) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStartPos(e.clientX);
    setResizeClip(clip);
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  
  // Handle clip resize movement
  const handleResizeMove = (e) => {
    if (!isResizing || !resizeClip) return;
    
    const deltaX = e.clientX - resizeStartPos;
    const deltaTime = deltaX / pxPerSecond;
    
    const newClip = { ...resizeClip };
    
    if (resizeDirection === 'start') {
      // Ensure start time doesn't exceed end time
      const newStartTime = Math.max(0, resizeClip.startTime - deltaTime);
      if (newStartTime < resizeClip.endTime - 0.5) { // Minimum clip duration of 0.5s
        newClip.startTime = newStartTime;
        newClip.duration = resizeClip.endTime - newStartTime;
      }
    } else {
      // Ensure end time doesn't go below start time
      const newEndTime = Math.max(resizeClip.startTime + 0.5, resizeClip.endTime + deltaTime);
      newClip.endTime = newEndTime;
      newClip.duration = newEndTime - resizeClip.startTime;
    }
    
    if (onClipResize) {
      onClipResize(newClip);
    }
    
    setResizeStartPos(e.clientX);
    setResizeClip(newClip);
  };
  
  // Handle end of clip resize
  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeDirection(null);
    setResizeClip(null);
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };
  
  // Handle drag end (clip movement)
  const handleDragEnd = (event) => {
    setIsDragging(false);
    
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find the source and destination tracks
      const sourceTrackId = active.data.current.trackId;
      const destTrackId = over.data.current.trackId;
      
      if (onClipMove) {
        onClipMove(active.id, {
          trackIndex: destTrackId,
          // Additional position details if needed
        });
      }
    }
  };
  
  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  // Delete selected clip
  const handleDeleteClip = () => {
    if (!selectedClipId) return;
    
    if (onClipDelete) {
      onClipDelete(selectedClipId);
    }
    
    setSelectedClipId(null);
  };
  
  // Scroll timeline to current playhead position
  useEffect(() => {
    if (!tracksRef.current || !playheadRef.current) return;
    
    const trackRect = tracksRef.current.getBoundingClientRect();
    const playheadPos = timeToPosition(currentTime);
    
    // Only scroll if playhead is outside visible area
    if (playheadPos < tracksRef.current.scrollLeft || 
        playheadPos > tracksRef.current.scrollLeft + trackRect.width - 150) {
      tracksRef.current.scrollLeft = playheadPos - trackRect.width / 2;
    }
  }, [currentTime, pxPerSecond]);
  
  // Generate tick marks for ruler
  const ticks = generateTicks();
  
  return (
    <TimelineContainer ref={timelineRef}>
      <TimelineHeader>
        <TimelineControls>
          <IconButton onClick={onPlayPause} title={isPlaying ? 'Pause' : 'Play'}>
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          </IconButton>
          
          <IconButton 
            onClick={() => onTimeUpdate(Math.max(0, currentTime - 1))} 
            title="Previous Frame"
          >
            <FontAwesomeIcon icon={faStepBackward} />
          </IconButton>
          
          <IconButton 
            onClick={() => onTimeUpdate(Math.min(duration, currentTime + 1))} 
            title="Next Frame"
          >
            <FontAwesomeIcon icon={faStepForward} />
          </IconButton>
          
          <div style={{ margin: '0 8px', color: 'var(--text-color)' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </TimelineControls>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={() => onAddClip && onAddClip('video')}>
            <FontAwesomeIcon icon={faVideo} />
            Add Video
          </Button>
          
          <Button onClick={() => onAddClip && onAddClip('audio')}>
            <FontAwesomeIcon icon={faMusic} />
            Add Audio
          </Button>
          
          <Button onClick={() => onAddClip && onAddClip('subtitle')}>
            <FontAwesomeIcon icon={faClosedCaptioning} />
            Add Text
          </Button>
          
          <Button onClick={() => onAddClip && onAddClip('voice')}>
            <FontAwesomeIcon icon={faVoicemail} />
            AI Voice
          </Button>
        </div>
        
        <TimelineZoom>
          <span style={{ color: 'var(--text-color)' }}>Zoom:</span>
          <ZoomInput 
            type="range" 
            min="0.1" 
            max="5" 
            step="0.1" 
            value={zoom} 
            onChange={(e) => onZoomChange && onZoomChange(parseFloat(e.target.value))} 
          />
        </TimelineZoom>
      </TimelineHeader>
      
      <TimelineTracks ref={tracksRef} onClick={handleTimelineClick}>
        <TimelineRuler style={{ width: timelineWidthPx }}>
          {ticks.map((tick, index) => (
            <React.Fragment key={`tick-${index}`}>
              <RulerTick 
                major={tick.isMajor} 
                left={timeToPosition(tick.time)} 
              />
              {tick.label && (
                <RulerLabel left={timeToPosition(tick.time)}>
                  {tick.label}
                </RulerLabel>
              )}
            </React.Fragment>
          ))}
        </TimelineRuler>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Video Tracks */}
          {Array.from({ length: 3 }).map((_, trackIndex) => (
            <TrackContainer key={`video-${trackIndex}`}>
              <TrackLabel>
                <FontAwesomeIcon icon={faVideo} />
                Video {trackIndex + 1}
              </TrackLabel>
              
              <TrackContent style={{ width: timelineWidthPx }}>
                <SortableContext 
                  items={clips.filter(clip => clip.type === 'video' && clip.trackIndex === trackIndex).map(c => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {clips
                    .filter(clip => clip.type === 'video' && clip.trackIndex === trackIndex)
                    .map(clip => {
                      const left = timeToPosition(clip.trackPosition);
                      const width = timeToPosition(clip.duration);
                      
                      return (
                        <SortableClip
                          key={clip.id}
                          clip={clip}
                          left={left}
                          width={width}
                          color="#4a90e2"
                          isSelected={selectedClipId === clip.id}
                          onClick={handleClipClick}
                          onResizeStart={handleResizeStart}
                        />
                      );
                    })}
                </SortableContext>
              </TrackContent>
            </TrackContainer>
          ))}
          
          {/* Audio tracks */}
          {audioTracks.map((track, trackIndex) => (
            <TrackContainer key={`audio-${track.id}`}>
              <TrackLabel>
                <FontAwesomeIcon icon={faMusic} />
                {track.name}
              </TrackLabel>
              
              <TrackContent style={{ width: timelineWidthPx }}>
                <SortableContext 
                  items={clips.filter(clip => clip.type === 'audio' && clip.trackIndex === trackIndex).map(c => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {clips
                    .filter(clip => clip.type === 'audio' && clip.trackIndex === trackIndex)
                    .map(clip => {
                      const left = timeToPosition(clip.trackPosition);
                      const width = timeToPosition(clip.duration);
                      
                      return (
                        <SortableClip
                          key={clip.id}
                          clip={clip}
                          left={left}
                          width={width}
                          color="#50e3c2"
                          isSelected={selectedClipId === clip.id}
                          onClick={handleClipClick}
                          onResizeStart={handleResizeStart}
                        />
                      );
                    })}
                </SortableContext>
              </TrackContent>
            </TrackContainer>
          ))}
          
          {/* Subtitle track */}
          <TrackContainer>
            <TrackLabel>
              <FontAwesomeIcon icon={faClosedCaptioning} />
              Subtitles
            </TrackLabel>
            
            <TrackContent style={{ width: timelineWidthPx }}>
              <SortableContext 
                items={subtitles.map(s => s.id)}
                strategy={horizontalListSortingStrategy}
              >
                {subtitles.map(subtitle => {
                  const left = timeToPosition(subtitle.startTime);
                  const width = timeToPosition(subtitle.endTime - subtitle.startTime);
                  
                  return (
                    <SortableClip
                      key={subtitle.id}
                      clip={{
                        ...subtitle,
                        name: subtitle.text,
                        duration: subtitle.endTime - subtitle.startTime,
                        trackPosition: subtitle.startTime
                      }}
                      left={left}
                      width={width}
                      color="#ff6b6b"
                      isSelected={selectedClipId === subtitle.id}
                      onClick={handleClipClick}
                      onResizeStart={handleResizeStart}
                    />
                  );
                })}
              </SortableContext>
            </TrackContent>
          </TrackContainer>
        </DndContext>
        
        {/* Playhead */}
        <Playhead 
          ref={playheadRef}
          position={timeToPosition(currentTime)} 
        />
      </TimelineTracks>
      
      {/* Clip operations toolbar */}
      {selectedClipId && (
        <div style={{
          padding: '8px',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <Button onClick={handleDeleteClip} title="Delete Clip">
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </Button>
          
          <Button onClick={() => {}} title="Split Clip">
            <FontAwesomeIcon icon={faScissors} />
            Split at Playhead
          </Button>
          
          <Button onClick={() => {}} title="Adjust Volume">
            <FontAwesomeIcon icon={faVolumeUp} />
            Audio Settings
          </Button>
        </div>
      )}
    </TimelineContainer>
  );
};

export default Timeline; 