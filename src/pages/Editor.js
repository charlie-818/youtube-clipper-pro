// src/pages/Editor.js - Main Video Editor Component

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faPause, faStop, faCut, 
  faSave, faFileExport, faVolumeUp, faClosedCaptioning,
  faVoicemail, faMusic, faPlus, faTrash
} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

// Import components
import VideoPlayer from '../components/VideoPlayer';
import Timeline from '../components/Timeline';
import ControlPanel from '../components/ControlPanel';
import EffectsPanel from '../components/EffectsPanel';
import SubtitleEditor from '../components/SubtitleEditor';
import AudioMixer from '../components/AudioMixer';
import VoiceGenerator from '../components/VoiceGenerator';
import ExportModal from '../components/ExportModal';
import YouTubeImportModal from '../components/YouTubeImportModal';

// Import hooks and contexts
import { useProject } from '../contexts/ProjectContext';
import { useTheme } from '../contexts/ThemeContext';

// Import services
import { ipcRenderer } from 'electron';
import { 
  saveProject, 
  loadProject,
  exportVideo,
  addClip,
  removeClip,
  updateClip,
  mergeClips,
  splitClip
} from '../services/projectService';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
`;

const VideoContainer = styled.div`
  flex: 1;
  min-height: 300px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

const Button = styled.button`
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: #3a80d2;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const Editor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { project, setProject, saveProjectState } = useProject();
  
  // Component state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedClip, setSelectedClip] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  
  const playerRef = useRef(null);
  const timelineRef = useRef(null);
  
  // Load project on mount if projectId is provided
  useEffect(() => {
    const loadProjectData = async () => {
      if (projectId) {
        try {
          window.dispatchEvent(new Event('start-loading'));
          const loadedProject = await loadProject(projectId);
          setProject(loadedProject);
          toast.success('Project loaded successfully');
        } catch (error) {
          console.error('Failed to load project:', error);
          toast.error('Failed to load project');
          navigate('/');
        } finally {
          window.dispatchEvent(new Event('stop-loading'));
        }
      } else {
        // Create new project
        setProject({
          id: Date.now().toString(),
          name: 'Untitled Project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timeline: {
            clips: [],
            subtitles: [],
            audioTracks: [
              { id: 'main', name: 'Main Audio', clips: [] }
            ]
          },
          settings: {
            resolution: '1080p',
            frameRate: 30,
            aspectRatio: '16:9'
          }
        });
      }
    };
    
    loadProjectData();
  }, [projectId, setProject, navigate]);
  
  // Auto-save project every 30 seconds
  useEffect(() => {
    if (!project) return;
    
    const intervalId = setInterval(() => {
      saveProjectState();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [project, saveProjectState]);
  
  // Player controls
  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleStop = () => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };
  
  // Timeline controls
  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
    if (playerRef.current && Math.abs(playerRef.current.currentTime - time) > 0.1) {
      playerRef.current.currentTime = time;
    }
  };
  
  const handleClipSelect = (clipId) => {
    const clip = project.timeline.clips.find(c => c.id === clipId);
    setSelectedClip(clip);
  };
  
  // YouTubes video import
  const handleImportYouTube = async (url, options) => {
    try {
      window.dispatchEvent(new Event('start-loading'));
      toast.info('Downloading YouTube video...');
      
      const result = await ipcRenderer.invoke('extract-youtube-video', url, options);
      
      // Add the downloaded video to the project
      const newClip = {
        id: Date.now().toString(),
        type: 'video',
        source: result.videoPath,
        name: result.title || 'YouTube Clip',
        startTime: 0,
        endTime: result.duration,
        trackPosition: 0,
        duration: result.duration
      };
      
      const updatedProject = addClip(project, newClip);
      setProject(updatedProject);
      
      // If subtitles were downloaded, add them too
      if (result.subtitlesPath) {
        // Process and add subtitles
        const subtitles = await ipcRenderer.invoke('generate-subtitles', result.subtitlesPath, {
          format: 'vtt'
        });
        
        const updatedProjectWithSubtitles = {
          ...updatedProject,
          timeline: {
            ...updatedProject.timeline,
            subtitles: subtitles
          }
        };
        
        setProject(updatedProjectWithSubtitles);
      }
      
      toast.success('YouTube video imported successfully');
      setShowImportModal(false);
    } catch (error) {
      console.error('Failed to import YouTube video:', error);
      toast.error(`Failed to import YouTube video: ${error.message}`);
    } finally {
      window.dispatchEvent(new Event('stop-loading'));
    }
  };
  
  // Split clip at current time
  const handleSplitClip = () => {
    if (!selectedClip) {
      toast.warning('Please select a clip to split');
      return;
    }
    
    const clipStartPosition = selectedClip.trackPosition;
    const clipTime = currentTime - clipStartPosition;
    
    if (clipTime <= 0 || clipTime >= selectedClip.duration) {
      toast.warning('Current position is outside the selected clip');
      return;
    }
    
    const updatedProject = splitClip(project, selectedClip.id, clipTime);
    setProject(updatedProject);
    toast.success('Clip split successfully');
  };
  
  // Save project
  const handleSaveProject = async () => {
    try {
      window.dispatchEvent(new Event('start-loading'));
      await saveProject(project);
      toast.success('Project saved successfully');
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    } finally {
      window.dispatchEvent(new Event('stop-loading'));
    }
  };
  
  // Export video
  const handleExport = async (exportOptions) => {
    try {
      window.dispatchEvent(new Event('start-loading'));
      toast.info('Exporting video...');
      
      const result = await exportVideo(project, exportOptions);
      
      if (result && result.outputPath) {
        toast.success(`Video exported successfully to: ${result.outputPath}`);
        setShowExportModal(false);
      }
    } catch (error) {
      console.error('Failed to export video:', error);
      toast.error(`Failed to export video: ${error.message}`);
    } finally {
      window.dispatchEvent(new Event('stop-loading'));
    }
  };
  
  if (!project) {
    return <div className="loading">Loading project...</div>;
  }
  
  return (
    <EditorContainer>
      <h1>{project.name || 'Untitled Project'}</h1>
      
      <ControlsContainer>
        <Button onClick={() => setShowImportModal(true)}>
          Import from YouTube
        </Button>
        <Button onClick={handleSaveProject}>
          Save Project
        </Button>
        <Button onClick={() => setShowExportModal(true)}>
          Export Project
        </Button>
      </ControlsContainer>
      
      {project.timeline.clips.length > 0 ? (
        <>
          <VideoContainer>
            <VideoPlayer
              ref={playerRef}
              project={project}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={setDuration}
            />
          </VideoContainer>
          <Timeline 
            ref={timelineRef}
            project={project}
            currentTime={currentTime}
            zoom={zoom}
            selectedClipId={selectedClip?.id}
            onTimeUpdate={handleTimeUpdate}
            onClipSelect={handleClipSelect}
            onClipUpdate={(updatedClip) => {
              const updatedProject = updateClip(project, updatedClip);
              setProject(updatedProject);
            }}
            onClipDelete={(clipId) => {
              const updatedProject = removeClip(project, clipId);
              setProject(updatedProject);
              if (selectedClip && selectedClip.id === clipId) {
                setSelectedClip(null);
              }
            }}
          />
          <SubtitleEditor 
            project={project}
            currentTime={currentTime}
            onUpdate={(subtitles) => {
              const updatedProject = {
                ...project,
                timeline: {
                  ...project.timeline,
                  subtitles
                }
              };
              setProject(updatedProject);
            }}
          />
          <AudioMixer 
            project={project}
            onUpdate={(audioTracks) => {
              const updatedProject = {
                ...project,
                timeline: {
                  ...project.timeline,
                  audioTracks
                }
              };
              setProject(updatedProject);
            }}
          />
          <VoiceGenerator 
            project={project}
            currentTime={currentTime}
            onGenerate={async (text, options) => {
              try {
                window.dispatchEvent(new Event('start-loading'));
                const result = await ipcRenderer.invoke('generate-voice', text, options);
                
                // Add the generated voice to an audio track
                const audioClip = {
                  id: Date.now().toString(),
                  type: 'audio',
                  source: result.audioPath,
                  name: 'AI Voice',
                  startTime: 0,
                  trackPosition: currentTime,
                  duration: result.duration
                };
                
                // Find or create a voice track
                let voiceTrackIndex = project.timeline.audioTracks.findIndex(track => track.name === 'Voice');
                if (voiceTrackIndex === -1) {
                  // Create voice track if it doesn't exist
                  project.timeline.audioTracks.push({
                    id: 'voice-track',
                    name: 'Voice',
                    clips: []
                  });
                  voiceTrackIndex = project.timeline.audioTracks.length - 1;
                }
                
                // Add clip to voice track
                const updatedAudioTracks = [...project.timeline.audioTracks];
                updatedAudioTracks[voiceTrackIndex].clips.push(audioClip);
                
                const updatedProject = {
                  ...project,
                  timeline: {
                    ...project.timeline,
                    audioTracks: updatedAudioTracks
                  }
                };
                
                setProject(updatedProject);
                toast.success('Voice generated successfully');
              } catch (error) {
                console.error('Failed to generate voice:', error);
                toast.error(`Failed to generate voice: ${error.message}`);
              } finally {
                window.dispatchEvent(new Event('stop-loading'));
              }
            }}
          />
        </>
      ) : (
        <div className="empty-state">
          <h2>No Video Source</h2>
          <p>Import a YouTube video to get started</p>
          <Button onClick={() => setShowImportModal(true)}>
            Import from YouTube
          </Button>
        </div>
      )}
      
      {showExportModal && (
        <ExportModal 
          project={project}
          onExport={handleExport}
          onClose={() => setShowExportModal(false)}
        />
      )}
      
      {showImportModal && (
        <YouTubeImportModal 
          onImport={handleImportYouTube}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </EditorContainer>
  );
};

// Helper function to format time as MM:SS.ms
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export default Editor;