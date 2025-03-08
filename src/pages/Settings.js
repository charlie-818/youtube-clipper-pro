import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faUndo } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

const SettingsContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  margin: 0;
`;

const ActionButton = styled.button`
  background-color: ${props => props.secondary ? '#555' : '#4a90e2'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 10px;
  
  &:hover {
    background-color: ${props => props.secondary ? '#666' : '#3a80d2'};
  }
  
  &:disabled {
    background-color: #888;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
`;

const SettingsGroup = styled.div`
  background-color: #252525;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const SettingsTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #444;
`;

const SettingRow = styled.div`
  display: flex;
  flex-direction: ${props => props.column ? 'column' : 'row'};
  justify-content: space-between;
  align-items: ${props => props.column ? 'flex-start' : 'center'};
  margin-bottom: 15px;
  padding-bottom: ${props => props.hasDivider ? '15px' : '0'};
  border-bottom: ${props => props.hasDivider ? '1px solid #333' : 'none'};
`;

const SettingLabel = styled.label`
  font-weight: 500;
`;

const SettingDescription = styled.p`
  margin: 5px 0 10px 0;
  color: #999;
  font-size: 13px;
`;

const Select = styled.select`
  background-color: #333;
  color: white;
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: #4a90e2;
  }
`;

const Input = styled.input`
  background-color: #333;
  color: white;
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: #4a90e2;
  }
  
  &[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
  
  &[type="number"] {
    width: 80px;
  }
`;

const ThemeSelector = styled.div`
  display: flex;
  gap: 10px;
`;

const ThemeOption = styled.div`
  width: 100px;
  cursor: pointer;
  border: 2px solid ${props => props.selected ? '#4a90e2' : 'transparent'};
  border-radius: 6px;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-3px);
  }
`;

const ThemePreview = styled.div`
  height: 70px;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#f5f5f5'};
  border: 1px solid ${props => props.theme === 'dark' ? '#333' : '#ddd'};
`;

const ThemeName = styled.div`
  padding: 8px;
  text-align: center;
  background-color: #252525;
  font-size: 12px;
`;

const SaveMessage = styled.div`
  margin-top: 10px;
  padding: 12px;
  background-color: #4cd964;
  color: #fff;
  border-radius: 4px;
  text-align: center;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s;
`;

function Settings({ preferences, setPreferences }) {
  const [settings, setSettings] = useState({ ...preferences });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const { theme, setTheme } = useTheme();
  
  // Reset hasChanges when preferences are loaded
  useEffect(() => {
    setSettings({ ...preferences });
    setHasChanges(false);
  }, [preferences]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setSettings(prev => {
      const newSettings = { ...prev, [name]: newValue };
      return newSettings;
    });
    
    setHasChanges(true);
  };
  
  const handleThemeChange = (newTheme) => {
    setSettings(prev => ({ ...prev, theme: newTheme }));
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    try {
      if (window.api && window.api.savePreferences) {
        await window.api.savePreferences(settings);
        setPreferences(settings);
        setTheme(settings.theme);
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveMessage('Error saving settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };
  
  const handleReset = () => {
    setSettings({ ...preferences });
    setHasChanges(false);
  };
  
  return (
    <SettingsContainer>
      <Header>
        <Title>Settings</Title>
        <ButtonGroup>
          <ActionButton 
            secondary 
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <FontAwesomeIcon icon={faUndo} />
            Reset
          </ActionButton>
          <ActionButton 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <FontAwesomeIcon icon={faSave} />
            Save Changes
          </ActionButton>
        </ButtonGroup>
      </Header>
      
      {saveMessage && <SaveMessage visible={!!saveMessage}>{saveMessage}</SaveMessage>}
      
      <SettingsGroup>
        <SettingsTitle>Appearance</SettingsTitle>
        <SettingRow column hasDivider>
          <SettingLabel>Theme</SettingLabel>
          <SettingDescription>Choose the application theme</SettingDescription>
          <ThemeSelector>
            <ThemeOption 
              onClick={() => handleThemeChange('dark')}
              selected={settings.theme === 'dark'}
            >
              <ThemePreview theme="dark" />
              <ThemeName>Dark</ThemeName>
            </ThemeOption>
            <ThemeOption 
              onClick={() => handleThemeChange('light')}
              selected={settings.theme === 'light'}
            >
              <ThemePreview theme="light" />
              <ThemeName>Light</ThemeName>
            </ThemeOption>
          </ThemeSelector>
        </SettingRow>
      </SettingsGroup>
      
      <SettingsGroup>
        <SettingsTitle>Project Settings</SettingsTitle>
        <SettingRow>
          <SettingLabel htmlFor="autoSave">Auto-save projects</SettingLabel>
          <Input 
            type="checkbox"
            id="autoSave"
            name="autoSave"
            checked={settings.autoSave}
            onChange={handleInputChange}
          />
        </SettingRow>
        
        <SettingRow hasDivider>
          <SettingLabel htmlFor="autoSaveInterval">Auto-save interval (minutes)</SettingLabel>
          <Input 
            type="number"
            id="autoSaveInterval"
            name="autoSaveInterval"
            min="1"
            max="60"
            value={settings.autoSaveInterval}
            onChange={handleInputChange}
            disabled={!settings.autoSave}
          />
        </SettingRow>
        
        <SettingRow>
          <SettingLabel htmlFor="defaultExportFormat">Default export format</SettingLabel>
          <Select 
            id="defaultExportFormat"
            name="defaultExportFormat"
            value={settings.defaultExportFormat}
            onChange={handleInputChange}
          >
            <option value="mp4">MP4</option>
            <option value="mov">MOV</option>
            <option value="webm">WebM</option>
            <option value="gif">GIF</option>
          </Select>
        </SettingRow>
        
        <SettingRow hasDivider>
          <SettingLabel htmlFor="defaultResolution">Default resolution</SettingLabel>
          <Select 
            id="defaultResolution"
            name="defaultResolution"
            value={settings.defaultResolution}
            onChange={handleInputChange}
          >
            <option value="1080p">1080p (FHD)</option>
            <option value="720p">720p (HD)</option>
            <option value="480p">480p (SD)</option>
            <option value="2160p">2160p (4K)</option>
          </Select>
        </SettingRow>
      </SettingsGroup>
      
      <SettingsGroup>
        <SettingsTitle>Performance</SettingsTitle>
        <SettingRow>
          <div>
            <SettingLabel htmlFor="hardwareAcceleration">Hardware acceleration</SettingLabel>
            <SettingDescription>Improves performance but may cause issues on some systems</SettingDescription>
          </div>
          <Input 
            type="checkbox"
            id="hardwareAcceleration"
            name="hardwareAcceleration"
            checked={settings.hardwareAcceleration}
            onChange={handleInputChange}
          />
        </SettingRow>
      </SettingsGroup>
    </SettingsContainer>
  );
}

export default Settings; 