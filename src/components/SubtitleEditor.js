// src/components/SubtitleEditor.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave, faPlus, faTrash, faTextHeight,
  faFont, faPalette, faAlignLeft, faAlignCenter,
  faAlignRight, faBold, faItalic, faUnderline,
  faEdit, faSync
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';

// Styled components
const EditorContainer = styled.div`
  background-color: var(--background-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--background-color);
`;

const EditorTitle = styled.h3`
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
`;

const SubtitleList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const SubtitleItem = styled.div`
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  background-color: ${props => props.isSelected ? 'var(--primary-color)' : 'var(--background-color)'};
  color: ${props => props.isSelected ? 'white' : 'var(--text-color)'};
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.isSelected ? 'var(--primary-color)' : 'rgba(128, 128, 128, 0.1)'};
  }
`;

const SubtitleTime = styled.div`
  font-size: 12px;
  margin-bottom: 4px;
  color: ${props => props.isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-secondary)'};
`;

const SubtitleText = styled.div`
  font-size: 14px;
`;

const EditorControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--background-color);
`;

const ControlButton = styled.button`
  background-color: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-color)'};
  border: 1px solid ${props => props.active ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: 4px;
  padding: 6px 8px;
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

const ControlDropdown = styled.select`
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 13px;
  height: 32px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const ColorPicker = styled.input`
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  cursor: pointer;
  background-color: transparent;
`;

const EditorForm = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
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

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.25);
  }
`;

const FlexRow = styled.div`
  display: flex;
  gap: 12px;
  
  & > div {
    flex: 1;
  }
`;

const EditorFooter = styled.div`
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--border-color);
`;

const PreviewContainer = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: #1a1a1a;
  position: relative;
`;

const PreviewSubtitle = styled.div`
  text-align: ${props => props.align || 'center'};
  color: ${props => props.color || 'white'};
  font-family: ${props => props.fontFamily || 'Arial'};
  font-size: ${props => props.fontSize || '24px'};
  font-weight: ${props => props.bold ? 'bold' : 'normal'};
  font-style: ${props => props.italic ? 'italic' : 'normal'};
  text-decoration: ${props => props.underline ? 'underline' : 'none'};
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${props => props.backgroundColor || 'transparent'};
  text-shadow: ${props => props.shadow ? '0 2px 4px rgba(0, 0, 0, 0.8)' : 'none'};
  max-width: 80%;
`;

// Helper functions
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 100 ? '0' : ''}${ms < 10 ? '0' : ''}${ms}`;
};

const parseTime = (timeString) => {
  const parts = timeString.split(':');
  const secParts = parts[1].split('.');
  
  const minutes = parseInt(parts[0]);
  const seconds = parseInt(secParts[0]);
  const milliseconds = parseInt(secParts[1] || 0);
  
  return minutes * 60 + seconds + milliseconds / 1000;
};

// SubtitleEditor component
const SubtitleEditor = ({
  subtitles = [],
  currentTime = 0,
  onUpdateSubtitle,
  onAddSubtitle,
  onDeleteSubtitle,
  onGenerateSubtitles
}) => {
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [editedSubtitle, setEditedSubtitle] = useState(null);
  const { theme } = useTheme();
  
  // Default style values
  const defaultStyle = {
    fontSize: '24px',
    fontFamily: 'Arial',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    align: 'center',
    bold: false,
    italic: false,
    underline: false,
    shadow: true
  };
  
  // Find current subtitle based on time
  useEffect(() => {
    if (!subtitles.length) return;
    
    const current = subtitles.find(
      sub => currentTime >= sub.startTime && currentTime <= sub.endTime
    );
    
    if (current && (!selectedSubtitle || current.id !== selectedSubtitle.id)) {
      setSelectedSubtitle(current);
      setEditedSubtitle({
        ...current,
        style: current.style || { ...defaultStyle }
      });
    }
  }, [currentTime, subtitles, selectedSubtitle]);
  
  // Handle selecting a subtitle
  const handleSelectSubtitle = (subtitle) => {
    setSelectedSubtitle(subtitle);
    setEditedSubtitle({
      ...subtitle,
      style: subtitle.style || { ...defaultStyle }
    });
  };
  
  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setEditedSubtitle(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle style changes
  const handleStyleChange = (property, value) => {
    setEditedSubtitle(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [property]: value
      }
    }));
  };
  
  // Save subtitle changes
  const handleSaveSubtitle = () => {
    if (!editedSubtitle) return;
    
    // Update time values from string to seconds if needed
    let updatedSubtitle = { ...editedSubtitle };
    
    if (typeof updatedSubtitle.startTime === 'string') {
      updatedSubtitle.startTime = parseTime(updatedSubtitle.startTime);
    }
    
    if (typeof updatedSubtitle.endTime === 'string') {
      updatedSubtitle.endTime = parseTime(updatedSubtitle.endTime);
    }
    
    if (onUpdateSubtitle) {
      onUpdateSubtitle(updatedSubtitle);
    }
  };
  
  // Add new subtitle
  const handleAddSubtitle = () => {
    const newSubtitle = {
      id: `sub-${Date.now()}`,
      startTime: currentTime,
      endTime: currentTime + 2, // Default 2-second duration
      text: 'New subtitle',
      style: { ...defaultStyle }
    };
    
    if (onAddSubtitle) {
      onAddSubtitle(newSubtitle);
    }
    
    setSelectedSubtitle(newSubtitle);
    setEditedSubtitle(newSubtitle);
  };
  
  // Delete subtitle
  const handleDeleteSubtitle = () => {
    if (!selectedSubtitle) return;
    
    if (onDeleteSubtitle) {
      onDeleteSubtitle(selectedSubtitle.id);
    }
    
    setSelectedSubtitle(null);
    setEditedSubtitle(null);
  };
  
  // Generate subtitles
  const handleGenerateSubtitles = () => {
    if (onGenerateSubtitles) {
      onGenerateSubtitles();
    }
  };
  
  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>Subtitle Editor</EditorTitle>
        <div>
          <ControlButton onClick={handleGenerateSubtitles} title="Generate Subtitles">
            <FontAwesomeIcon icon={faSync} />
            Auto-Generate
          </ControlButton>
        </div>
      </EditorHeader>
      
      <EditorControls>
        <ControlButton onClick={handleAddSubtitle} title="Add Subtitle">
          <FontAwesomeIcon icon={faPlus} />
          Add
        </ControlButton>
        
        <ControlButton 
          onClick={handleDeleteSubtitle} 
          disabled={!selectedSubtitle}
          title="Delete Subtitle"
        >
          <FontAwesomeIcon icon={faTrash} />
          Delete
        </ControlButton>
        
        <ControlButton 
          onClick={handleSaveSubtitle} 
          disabled={!editedSubtitle}
          title="Save Changes"
        >
          <FontAwesomeIcon icon={faSave} />
          Save
        </ControlButton>
      </EditorControls>
      
      <FlexRow style={{ flex: 1, overflow: 'hidden' }}>
        <SubtitleList>
          {subtitles.map(subtitle => (
            <SubtitleItem 
              key={subtitle.id}
              isSelected={selectedSubtitle && selectedSubtitle.id === subtitle.id}
              onClick={() => handleSelectSubtitle(subtitle)}
            >
              <SubtitleTime isSelected={selectedSubtitle && selectedSubtitle.id === subtitle.id}>
                {formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}
              </SubtitleTime>
              <SubtitleText>{subtitle.text}</SubtitleText>
            </SubtitleItem>
          ))}
        </SubtitleList>
        
        {editedSubtitle && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <EditorForm>
              <FlexRow>
                <FormGroup>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    value={typeof editedSubtitle.startTime === 'number' 
                      ? formatTime(editedSubtitle.startTime) 
                      : editedSubtitle.startTime}
                    onChange={handleInputChange}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    value={typeof editedSubtitle.endTime === 'number' 
                      ? formatTime(editedSubtitle.endTime) 
                      : editedSubtitle.endTime}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </FlexRow>
              
              <FormGroup>
                <Label htmlFor="text">Subtitle Text</Label>
                <TextArea
                  id="text"
                  name="text"
                  value={editedSubtitle.text}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Style</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <ControlDropdown
                    value={editedSubtitle.style.fontFamily}
                    onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                    title="Font Family"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Impact">Impact</option>
                  </ControlDropdown>
                  
                  <ControlDropdown
                    value={editedSubtitle.style.fontSize}
                    onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                    title="Font Size"
                  >
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="22px">22px</option>
                    <option value="24px">24px</option>
                    <option value="28px">28px</option>
                    <option value="32px">32px</option>
                    <option value="36px">36px</option>
                    <option value="40px">40px</option>
                  </ControlDropdown>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FontAwesomeIcon icon={faPalette} />
                    <ColorPicker
                      type="color"
                      value={editedSubtitle.style.color}
                      onChange={(e) => handleStyleChange('color', e.target.value)}
                      title="Text Color"
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>BG:</span>
                    <ColorPicker
                      type="color"
                      value={editedSubtitle.style.backgroundColor.startsWith('rgba') 
                        ? '#000000'  // Default for rgba
                        : editedSubtitle.style.backgroundColor}
                      onChange={(e) => handleStyleChange(
                        'backgroundColor', 
                        `${e.target.value}80`  // Add 50% opacity
                      )}
                      title="Background Color"
                    />
                  </div>
                  
                  <ControlButton
                    active={editedSubtitle.style.align === 'left'}
                    onClick={() => handleStyleChange('align', 'left')}
                    title="Align Left"
                  >
                    <FontAwesomeIcon icon={faAlignLeft} />
                  </ControlButton>
                  
                  <ControlButton
                    active={editedSubtitle.style.align === 'center'}
                    onClick={() => handleStyleChange('align', 'center')}
                    title="Align Center"
                  >
                    <FontAwesomeIcon icon={faAlignCenter} />
                  </ControlButton>
                  
                  <ControlButton
                    active={editedSubtitle.style.align === 'right'}
                    onClick={() => handleStyleChange('align', 'right')}
                    title="Align Right"
                  >
                    <FontAwesomeIcon icon={faAlignRight} />
                  </ControlButton>
                  
                  <ControlButton
                    active={editedSubtitle.style.bold}
                    onClick={() => handleStyleChange('bold', !editedSubtitle.style.bold)}
                    title="Bold"
                  >
                    <FontAwesomeIcon icon={faBold} />
                  </ControlButton>
                  
                  <ControlButton
                    active={editedSubtitle.style.italic}
                    onClick={() => handleStyleChange('italic', !editedSubtitle.style.italic)}
                    title="Italic"
                  >
                    <FontAwesomeIcon icon={faItalic} />
                  </ControlButton>
                  
                  <ControlButton
                    active={editedSubtitle.style.underline}
                    onClick={() => handleStyleChange('underline', !editedSubtitle.style.underline)}
                    title="Underline"
                  >
                    <FontAwesomeIcon icon={faUnderline} />
                  </ControlButton>
                  
                  <ControlButton
                    active={editedSubtitle.style.shadow}
                    onClick={() => handleStyleChange('shadow', !editedSubtitle.style.shadow)}
                    title="Text Shadow"
                  >
                    Shadow
                  </ControlButton>
                </div>
              </FormGroup>
            </EditorForm>
            
            <PreviewContainer>
              <PreviewSubtitle
                fontFamily={editedSubtitle.style.fontFamily}
                fontSize={editedSubtitle.style.fontSize}
                color={editedSubtitle.style.color}
                backgroundColor={editedSubtitle.style.backgroundColor}
                align={editedSubtitle.style.align}
                bold={editedSubtitle.style.bold}
                italic={editedSubtitle.style.italic}
                underline={editedSubtitle.style.underline}
                shadow={editedSubtitle.style.shadow}
              >
                {editedSubtitle.text}
              </PreviewSubtitle>
            </PreviewContainer>
          </div>
        )}
      </FlexRow>
      
      <EditorFooter>
        <div>
          {subtitles.length} subtitles
        </div>
        <div>
          <ControlButton onClick={handleSaveSubtitle} disabled={!editedSubtitle}>
            <FontAwesomeIcon icon={faSave} />
            Save Changes
          </ControlButton>
        </div>
      </EditorFooter>
    </EditorContainer>
  );
};

export default SubtitleEditor; 