import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileVideo, faFilm, faImages, faMusic,
  faVolumeUp, faFont, faFileAudio, faPhotoVideo
} from '@fortawesome/free-solid-svg-icons';

const SidebarContainer = styled.div`
  background-color: var(--background-color);
  width: ${props => props.collapsed ? '60px' : '240px'};
  height: 100%;
  border-right: 1px solid var(--border-color);
  transition: width 0.3s ease;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
`;

const SidebarSection = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
`;

const SidebarTitle = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
  padding: 0 16px;
  margin-bottom: 8px;
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const SidebarItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.collapsed ? '12px 0' : '10px 16px'};
  cursor: pointer;
  transition: background-color 0.2s;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
  
  &:hover {
    background-color: rgba(128, 128, 128, 0.1);
  }
`;

const SidebarIcon = styled.div`
  width: ${props => props.collapsed ? '100%' : '24px'};
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  margin-right: ${props => props.collapsed ? '0' : '12px'};
`;

const SidebarText = styled.div`
  color: var(--text-color);
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const Sidebar = ({ collapsed }) => {
  const mediaItems = [
    { icon: faFileVideo, text: 'Videos' },
    { icon: faFilm, text: 'Templates' },
    { icon: faImages, text: 'Images' },
    { icon: faMusic, text: 'Music' }
  ];
  
  const toolsItems = [
    { icon: faVolumeUp, text: 'Voice Generator' },
    { icon: faFont, text: 'Text Effects' },
    { icon: faFileAudio, text: 'Audio Effects' },
    { icon: faPhotoVideo, text: 'Video Effects' }
  ];
  
  return (
    <SidebarContainer collapsed={collapsed}>
      <SidebarSection>
        <SidebarTitle collapsed={collapsed}>Media Library</SidebarTitle>
        {mediaItems.map((item, index) => (
          <SidebarItem key={index} collapsed={collapsed}>
            <SidebarIcon collapsed={collapsed}>
              <FontAwesomeIcon icon={item.icon} />
            </SidebarIcon>
            <SidebarText collapsed={collapsed}>{item.text}</SidebarText>
          </SidebarItem>
        ))}
      </SidebarSection>
      
      <SidebarSection>
        <SidebarTitle collapsed={collapsed}>Creative Tools</SidebarTitle>
        {toolsItems.map((item, index) => (
          <SidebarItem key={index} collapsed={collapsed}>
            <SidebarIcon collapsed={collapsed}>
              <FontAwesomeIcon icon={item.icon} />
            </SidebarIcon>
            <SidebarText collapsed={collapsed}>{item.text}</SidebarText>
          </SidebarItem>
        ))}
      </SidebarSection>
    </SidebarContainer>
  );
};

export default Sidebar; 