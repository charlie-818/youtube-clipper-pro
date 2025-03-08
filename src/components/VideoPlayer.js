import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faPause, faVolumeUp, faVolumeMute, 
  faExpand, faCompress, faRedo, faUndo,
  faClosedCaptioning
} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

// Styled components
const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  background-color: var(--background-secondary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px var(--shadow-color);
`;

const VideoElement = styled.video`
  width: 100%;
  height: auto;
  display: block;
`;

const ControlsOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
  padding: 16px;
  display: flex;
  flex-direction: column;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  position: relative;
  margin-bottom: 12px;
  cursor: pointer;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 3px;
  position: absolute;
  top: 0;
  left: 0;
  width: ${props => props.width}%;
`;

const ProgressHandle = styled.div`
  width: 14px;
  height: 14px;
  background-color: var(--primary-color);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: ${props => props.position}%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
`;

const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
  }
`;

const TimeDisplay = styled.div`
  color: white;
  font-size: 14px;
  margin: 0 16px;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
`;

const VolumeSlider = styled.input`
  width: 80px;
  margin-left: 8px;
  -webkit-appearance: none;
  background-color: rgba(255, 255, 255, 0.2);
  height: 4px;
  border-radius: 2px;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background-color: white;
    border-radius: 50%;
    cursor: pointer;
  }

  &:focus {
    outline: none;
  }
`;

const SubtitleOverlay = styled.div`
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  text-align: center;
  pointer-events: none;
`;

const SubtitleText = styled.div`
  color: white;
  font-size: 22px;
  text-shadow: 0 0 4px black;
  background-color: rgba(0, 0, 0, 0.5);
  display: inline-block;
  padding: 6px 12px;
  border-radius: 4px;
  max-width: 80%;
  margin: 0 auto;
`;

// Format time display (seconds -> MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// VideoPlayer Component
const VideoPlayer = forwardRef(({
  src,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  onEnded,
  startTime = 0,
  subtitles = [],
  aspectRatio = "16:9"
}, ref) => {
  // State variables
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const containerRef = useRef(null);
  const { theme } = useTheme();

  // Expose video methods to parent
  useImperativeHandle(ref, () => ({
    play: () => {
      videoRef.current?.play();
    },
    pause: () => {
      videoRef.current?.pause();
    },
    seek: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    get currentTime() {
      return videoRef.current?.currentTime || 0;
    },
    set currentTime(time) {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    get duration() {
      return videoRef.current?.duration || 0;
    },
    get volume() {
      return videoRef.current?.volume || 0;
    },
    set volume(vol) {
      if (videoRef.current) {
        videoRef.current.volume = vol;
        setVolume(vol);
      }
    }
  }));

  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      // Clear any existing timeout
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      
      // Set a new timeout to hide controls after 3 seconds
      const timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
      
      setControlsTimeout(timeout);
    };
    
    // Add event listeners
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) {
          setShowControls(false);
        }
      });
    }
    
    // Clean up
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', () => {});
      }
      
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [isPlaying, controlsTimeout]);

  // Handle time update to find current subtitle
  useEffect(() => {
    if (!subtitles || subtitles.length === 0) {
      setCurrentSubtitle(null);
      return;
    }
    
    const active = subtitles.find(
      sub => currentTime >= sub.startTime && currentTime <= sub.endTime
    );
    
    setCurrentSubtitle(active);
  }, [currentTime, subtitles]);

  // Set initial time if provided
  useEffect(() => {
    if (videoRef.current && startTime) {
      videoRef.current.currentTime = startTime;
    }
  }, [startTime, src]);

  // Video event handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
    }
  };

  const handleDurationChange = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      if (onDurationChange) {
        onDurationChange(video.duration);
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (onPlay) {
      onPlay();
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (onPause) {
      onPause();
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) {
      onEnded();
    }
  };

  // Control handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    const newVolume = parseFloat(e.target.value);
    if (video) {
      video.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        video.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        video.muted = false;
        setIsMuted(false);
      }
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const video = videoRef.current;
    
    if (video) {
      video.currentTime = percent * video.duration;
    }
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, video.currentTime - 10);
    }
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.min(video.duration, video.currentTime + 10);
    }
  };

  const toggleSubtitles = () => {
    setShowSubtitles(!showSubtitles);
  };

  // Set up fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Calculate progress percentage
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerContainer ref={containerRef} className="video-player">
      <VideoElement
        ref={videoRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onClick={togglePlay}
        style={{ aspectRatio }}
      />
      
      {/* Subtitle display */}
      {showSubtitles && currentSubtitle && (
        <SubtitleOverlay>
          <SubtitleText>{currentSubtitle.text}</SubtitleText>
        </SubtitleOverlay>
      )}
      
      {/* Controls overlay */}
      <ControlsOverlay visible={showControls}>
        <ProgressBar onClick={handleProgressClick}>
          <ProgressFill width={progressPercent} />
          <ProgressHandle position={progressPercent} />
        </ProgressBar>
        
        <ControlsRow>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ControlButton onClick={togglePlay}>
              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
            </ControlButton>
            
            <ControlButton onClick={skipBackward}>
              <FontAwesomeIcon icon={faUndo} />
            </ControlButton>
            
            <ControlButton onClick={skipForward}>
              <FontAwesomeIcon icon={faRedo} />
            </ControlButton>
            
            <VolumeControl>
              <ControlButton onClick={toggleMute}>
                <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
              </ControlButton>
              <VolumeSlider
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
              />
            </VolumeControl>
            
            <TimeDisplay>
              {formatTime(currentTime)} / {formatTime(duration)}
            </TimeDisplay>
          </div>
          
          <div>
            <ControlButton onClick={toggleSubtitles} title="Toggle subtitles">
              <FontAwesomeIcon icon={faClosedCaptioning} 
                color={showSubtitles ? 'white' : 'gray'} />
            </ControlButton>
            
            <ControlButton onClick={toggleFullscreen}>
              <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
            </ControlButton>
          </div>
        </ControlsRow>
      </ControlsOverlay>
    </PlayerContainer>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer; 