// src/components/YouTubeImportModal.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faYoutube, faTimes, faDownload, 
  faClosedCaptioning, faVolumeUp 
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';

// Styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: var(--modal-background);
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: var(--text-color);
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(128, 128, 128, 0.1);
    color: var(--text-color);
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  color: var(--text-color);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.25);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.25);
  }
`;

const ToggleRow = styled.div`
  display: flex;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const FlexRow = styled.div`
  display: flex;
  gap: 12px;
  
  & > div {
    flex: 1;
  }
`;

const ModalFooter = styled.div`
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border-color);
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: var(--primary-color);
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: #3a80d2;
  }
  
  &:active:not(:disabled) {
    background-color: #2a70c2;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  
  &:hover:not(:disabled) {
    background-color: var(--background-secondary);
  }
`;

// Helper functions
const isValidYouTubeUrl = (url) => {
  // Simple YouTube URL validation
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  return youtubeRegex.test(url);
};

// YouTube Import Modal Component
const YouTubeImportModal = ({ isOpen, onClose, onImport }) => {
  // State
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('1080p');
  const [format, setFormat] = useState('mp4');
  const [extractSubtitles, setExtractSubtitles] = useState(true);
  const [subtitleLanguage, setSubtitleLanguage] = useState('en');
  const [extractAudio, setExtractAudio] = useState(false);
  const [audioFormat, setAudioFormat] = useState('mp3');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const { theme } = useTheme();
  
  // URL validation
  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsValidUrl(isValidYouTubeUrl(newUrl));
  };
  
  // Import the YouTube video
  const handleImport = async () => {
    if (!isValidUrl || isImporting) return;
    
    setIsImporting(true);
    
    // Prepare options for YouTube downloader
    const options = {
      quality,
      format,
      extract_subtitles: extractSubtitles,
      subtitle_languages: [subtitleLanguage],
      extract_audio: extractAudio,
      audio_format: audioFormat,
      audio_quality: '192'
    };
    
    try {
      // Call the import function passed as prop
      await onImport(url, options);
      
      // Reset form
      setUrl('');
      setIsImporting(false);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to import YouTube video:', error);
      setIsImporting(false);
      // Error handling would typically be done in the parent component
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FontAwesomeIcon icon={faYoutube} style={{ color: '#FF0000' }} />
            Import YouTube Video
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <FormGroup>
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <Input
              id="youtube-url"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={handleUrlChange}
            />
          </FormGroup>
          
          <FlexRow>
            <FormGroup>
              <Label htmlFor="video-quality">Video Quality</Label>
              <Select
                id="video-quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="360p">360p</option>
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p (HD)</option>
                <option value="1440p">1440p (2K)</option>
                <option value="4k">2160p (4K)</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="video-format">Video Format</Label>
              <Select
                id="video-format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
              </Select>
            </FormGroup>
          </FlexRow>
          
          <ToggleRow>
            <ToggleLabel htmlFor="extract-subtitles">
              <FontAwesomeIcon icon={faClosedCaptioning} />
              Extract subtitles/captions
            </ToggleLabel>
            <Checkbox
              id="extract-subtitles"
              type="checkbox"
              checked={extractSubtitles}
              onChange={(e) => setExtractSubtitles(e.target.checked)}
            />
          </ToggleRow>
          
          {extractSubtitles && (
            <FormGroup>
              <Label htmlFor="subtitle-language">Subtitle Language</Label>
              <Select
                id="subtitle-language"
                value={subtitleLanguage}
                onChange={(e) => setSubtitleLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </Select>
            </FormGroup>
          )}
          
          <ToggleRow>
            <ToggleLabel htmlFor="extract-audio">
              <FontAwesomeIcon icon={faVolumeUp} />
              Also extract audio-only version
            </ToggleLabel>
            <Checkbox
              id="extract-audio"
              type="checkbox"
              checked={extractAudio}
              onChange={(e) => setExtractAudio(e.target.checked)}
            />
          </ToggleRow>
          
          {extractAudio && (
            <FormGroup>
              <Label htmlFor="audio-format">Audio Format</Label>
              <Select
                id="audio-format"
                value={audioFormat}
                onChange={(e) => setAudioFormat(e.target.value)}
              >
                <option value="mp3">MP3</option>
                <option value="m4a">M4A</option>
                <option value="wav">WAV</option>
                <option value="flac">FLAC</option>
              </Select>
            </FormGroup>
          )}
        </ModalBody>
        
        <ModalFooter>
          <SecondaryButton onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton 
            onClick={handleImport} 
            disabled={!isValidUrl || isImporting}
          >
            <FontAwesomeIcon icon={faDownload} />
            {isImporting ? 'Importing...' : 'Import Video'}
          </PrimaryButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default YouTubeImportModal; 