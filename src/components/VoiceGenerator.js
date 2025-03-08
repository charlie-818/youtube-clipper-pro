// src/components/VoiceGenerator.js
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faPause, faStop, faVolumeUp, 
  faRobot, faMicrophone, faFileAudio, faTrash,
  faSave, faUpload, faScriptAlt, faTextHeight,
  faSync, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';

// Styled components
const Container = styled.div`
  background-color: var(--background-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--background-color);
`;

const Title = styled.h3`
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--background-color);
`;

const Button = styled.button`
  background-color: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-color)'};
  border: 1px solid ${props => props.active ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color)' : 'rgba(128, 128, 128, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 13px;
  height: 35px;
  min-width: 180px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const Range = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background-color: var(--slider-background);
  margin: 10px 0;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: var(--primary-color);
    cursor: pointer;
  }
  
  &:focus {
    outline: none;
  }
`;

const TextEditor = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 14px;
  line-height: 1.5;
  min-height: 200px;
  flex: 1;
  resize: none;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.25);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-color);
`;

const VoicePreviewItem = styled.div`
  padding: 12px;
  margin: 8px 0;
  border-radius: 6px;
  background-color: var(--background-color);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const VoiceInfo = styled.div`
  flex: 1;
`;

const VoiceName = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`;

const VoiceDescription = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border-color);
`;

const Tab = styled.button`
  padding: 10px 16px;
  background-color: ${props => props.active ? 'var(--background-secondary)' : 'var(--background-color)'};
  color: var(--text-color);
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : 'normal'};
  
  &:hover {
    background-color: var(--background-secondary);
  }
`;

const TabContent = styled.div`
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  display: ${props => props.active ? 'block' : 'none'};
`;

const FlexRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  
  & > div {
    flex: 1;
  }
`;

const AudioPreview = styled.div`
  margin-top: 20px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--background-color);
`;

const AudioControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AudioProgressContainer = styled.div`
  flex: 1;
  margin: 0 12px;
`;

const TimeDisplay = styled.div`
  color: var(--text-color);
  font-size: 12px;
  min-width: 45px;
  text-align: center;
`;

const GenerationStatus = styled.div`
  padding: 12px;
  margin-top: 16px;
  border-radius: 6px;
  background-color: ${props => {
    if (props.status === 'success') return 'rgba(80, 200, 120, 0.2)';
    if (props.status === 'error') return 'rgba(255, 100, 100, 0.2)';
    return 'rgba(74, 144, 226, 0.2)';
  }};
  color: var(--text-color);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Spinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(74, 144, 226, 0.25);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Voice Generator Component
const VoiceGenerator = ({
  onGenerateVoice,
  onAddVoiceClip,
  currentText = '',
  currentTime = 0
}) => {
  // State
  const [activeTab, setActiveTab] = useState('generate');
  const [text, setText] = useState(currentText);
  const [voice, setVoice] = useState('en-US-Neural2-F');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [emotion, setEmotion] = useState('neutral');
  const [audioSrc, setAudioSrc] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [voiceHistory, setVoiceHistory] = useState([]);
  
  // Refs
  const audioRef = useRef(null);
  const { theme } = useTheme();
  
  // Available voices
  const availableVoices = [
    { id: 'en-US-Neural2-F', name: 'Emma (US Female)', description: 'Neutral American female voice' },
    { id: 'en-US-Neural2-M', name: 'Mike (US Male)', description: 'Neutral American male voice' },
    { id: 'en-GB-Neural2-F', name: 'Sophia (UK Female)', description: 'British female voice' },
    { id: 'en-GB-Neural2-M', name: 'William (UK Male)', description: 'British male voice' },
    { id: 'en-AU-Neural2-F', name: 'Olivia (AU Female)', description: 'Australian female voice' },
    { id: 'en-AU-Neural2-M', name: 'Lucas (AU Male)', description: 'Australian male voice' },
  ];
  
  // Update audio duration when the audio file changes
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        setAudioDuration(audio.duration);
      };
      
      const handleTimeUpdate = () => {
        setCurrentAudioTime(audio.currentTime);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentAudioTime(0);
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioSrc]);
  
  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Handle text change
  const handleTextChange = (e) => {
    setText(e.target.value);
  };
  
  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle audio playback controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleStop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentAudioTime(0);
  };
  
  const handleSeek = (e) => {
    if (!audioRef.current) return;
    
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentAudioTime(seekTime);
  };
  
  // Generate voice
  const handleGenerateVoice = async () => {
    if (!text.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setGenerationStatus({ type: 'info', message: 'Generating voice...' });
    
    try {
      // Voice generation options
      const options = {
        voice,
        speed,
        pitch,
        emotion
      };
      
      // Call the external generation function
      if (onGenerateVoice) {
        const result = await onGenerateVoice(text, options);
        
        if (result && result.audioUrl) {
          setAudioSrc(result.audioUrl);
          setGenerationStatus({ type: 'success', message: 'Voice generated successfully!' });
          
          // Add to history
          const newHistoryItem = {
            id: Date.now().toString(),
            text,
            voice,
            audioUrl: result.audioUrl,
            options,
            createdAt: new Date().toISOString(),
            duration: result.duration || 0
          };
          
          setVoiceHistory(prev => [newHistoryItem, ...prev]);
        }
      }
    } catch (error) {
      console.error('Failed to generate voice:', error);
      setGenerationStatus({ type: 'error', message: `Failed to generate voice: ${error.message}` });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Add generated voice to the project
  const handleAddToProject = () => {
    if (!audioSrc || !onAddVoiceClip) return;
    
    const voiceClip = {
      id: `voice-${Date.now()}`,
      type: 'voice',
      source: audioSrc,
      name: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
      text,
      voice,
      duration: audioDuration,
      trackPosition: currentTime,
      options: {
        speed,
        pitch,
        emotion
      }
    };
    
    onAddVoiceClip(voiceClip);
  };
  
  // Handle adding a voice from history
  const handleAddVoiceFromHistory = (historyItem) => {
    if (!historyItem.audioUrl || !onAddVoiceClip) return;
    
    const voiceClip = {
      id: `voice-${Date.now()}`,
      type: 'voice',
      source: historyItem.audioUrl,
      name: historyItem.text.substring(0, 30) + (historyItem.text.length > 30 ? '...' : ''),
      text: historyItem.text,
      voice: historyItem.voice,
      duration: historyItem.duration || 0,
      trackPosition: currentTime,
      options: historyItem.options
    };
    
    onAddVoiceClip(voiceClip);
  };
  
  // Play a voice from history
  const handlePlayVoiceFromHistory = (audioUrl) => {
    setAudioSrc(audioUrl);
    setActiveTab('generate');
    
    // Play after a short delay to allow audio to load
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }, 100);
  };
  
  // Delete a voice from history
  const handleDeleteVoiceFromHistory = (id) => {
    setVoiceHistory(prev => prev.filter(item => item.id !== id));
  };
  
  // Generate suggestions based on audio/video content
  const handleSuggestScript = () => {
    // This would typically call an AI service to analyze the video/audio
    // and suggest a script. For now, we'll just set a placeholder.
    setText(
      "Welcome to our product demonstration. Today, I'll be showing you the key features of our new software. " +
      "This innovative solution helps users accomplish tasks more efficiently while providing a seamless experience."
    );
  };
  
  return (
    <Container>
      <Header>
        <Title>AI Voice Generator</Title>
      </Header>
      
      <TabContainer>
        <Tab
          active={activeTab === 'generate'}
          onClick={() => handleTabChange('generate')}
        >
          Generate Voice
        </Tab>
        <Tab
          active={activeTab === 'history'}
          onClick={() => handleTabChange('history')}
        >
          Voice History
        </Tab>
      </TabContainer>
      
      <TabContent active={activeTab === 'generate'}>
        <FormGroup>
          <FlexRow>
            <div>
              <Label htmlFor="voice-select">Voice</Label>
              <Select
                id="voice-select"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
              >
                {availableVoices.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </Select>
            </div>
            
            <div>
              <Label htmlFor="emotion-select">Emotion</Label>
              <Select
                id="emotion-select"
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
              >
                <option value="neutral">Neutral</option>
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="angry">Angry</option>
                <option value="excited">Excited</option>
                <option value="calm">Calm</option>
              </Select>
            </div>
          </FlexRow>
          
          <FlexRow>
            <div>
              <Label htmlFor="speed-slider">Speed: {speed.toFixed(1)}</Label>
              <Range
                id="speed-slider"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="pitch-slider">Pitch: {pitch > 0 ? `+${pitch}` : pitch}</Label>
              <Range
                id="pitch-slider"
                type="range"
                min="-10"
                max="10"
                step="1"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
              />
            </div>
          </FlexRow>
        </FormGroup>
        
        <FormGroup>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label htmlFor="voice-text">Script</Label>
            <Button onClick={handleSuggestScript} title="Suggest Script">
              <FontAwesomeIcon icon={faRobot} />
              Suggest
            </Button>
          </div>
          <TextEditor
            id="voice-text"
            value={text}
            onChange={handleTextChange}
            placeholder="Enter the text you want to convert to speech..."
          />
        </FormGroup>
        
        <Button 
          onClick={handleGenerateVoice} 
          disabled={!text.trim() || isGenerating}
          style={{ marginRight: '8px' }}
        >
          {isGenerating ? (
            <>
              <Spinner />
              Generating...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faRobot} />
              Generate Voice
            </>
          )}
        </Button>
        
        {audioSrc && (
          <Button 
            onClick={handleAddToProject} 
            disabled={isGenerating}
          >
            <FontAwesomeIcon icon={faSave} />
            Add to Timeline
          </Button>
        )}
        
        {generationStatus && (
          <GenerationStatus status={generationStatus.type}>
            {generationStatus.type === 'info' && <Spinner />}
            {generationStatus.type === 'success' && <FontAwesomeIcon icon={faVolumeUp} />}
            {generationStatus.type === 'error' && <FontAwesomeIcon icon={faStop} />}
            {generationStatus.message}
          </GenerationStatus>
        )}
        
        {audioSrc && (
          <AudioPreview>
            <audio ref={audioRef} src={audioSrc} preload="metadata" />
            
            <AudioControls>
              <Button onClick={togglePlay}>
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
              </Button>
              
              <Button onClick={handleStop}>
                <FontAwesomeIcon icon={faStop} />
              </Button>
              
              <TimeDisplay>{formatTime(currentAudioTime)}</TimeDisplay>
              
              <AudioProgressContainer>
                <Range
                  type="range"
                  min="0"
                  max={audioDuration || 0}
                  step="0.01"
                  value={currentAudioTime}
                  onChange={handleSeek}
                />
              </AudioProgressContainer>
              
              <TimeDisplay>{formatTime(audioDuration)}</TimeDisplay>
            </AudioControls>
          </AudioPreview>
        )}
      </TabContent>
      
      <TabContent active={activeTab === 'history'}>
        {voiceHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <FontAwesomeIcon icon={faFileAudio} style={{ fontSize: '32px', marginBottom: '16px' }} />
            <p>No voice history yet. Generate some voices to see them here.</p>
          </div>
        ) : (
          voiceHistory.map((item) => (
            <VoicePreviewItem key={item.id}>
              <VoiceInfo>
                <VoiceName>{item.text.substring(0, 40) + (item.text.length > 40 ? '...' : '')}</VoiceName>
                <VoiceDescription>
                  {availableVoices.find(v => v.id === item.voice)?.name || item.voice} • 
                  {item.duration ? ` ${formatTime(item.duration)}` : ' Unknown duration'} • 
                  {new Date(item.createdAt).toLocaleString()}
                </VoiceDescription>
              </VoiceInfo>
              
              <ActionButtons>
                <Button onClick={() => handlePlayVoiceFromHistory(item.audioUrl)}>
                  <FontAwesomeIcon icon={faPlay} />
                </Button>
                
                <Button onClick={() => handleAddVoiceFromHistory(item)}>
                  <FontAwesomeIcon icon={faSave} />
                </Button>
                
                <Button onClick={() => handleDeleteVoiceFromHistory(item.id)}>
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </ActionButtons>
            </VoicePreviewItem>
          ))
        )}
      </TabContent>
    </Container>
  );
};

export default VoiceGenerator; 