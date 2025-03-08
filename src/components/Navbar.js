import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faEdit, faFolder, faGear,
  faBars, faMoon, faSun, faVideo, faPlus
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';

const NavbarContainer = styled.nav`
  background-color: var(--nav-background);
  color: var(--nav-color);
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
  z-index: 100;
`;

const Logo = styled.div`
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--primary-color);
`;

const NavItems = styled.div`
  display: flex;
  gap: 20px;
`;

const NavItem = styled(Link)`
  color: var(--nav-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  
  &:hover {
    background-color: rgba(128, 128, 128, 0.1);
    text-decoration: none;
  }
  
  &.active {
    background-color: var(--primary-color);
    color: white;
  }
`;

const NavControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--nav-color);
  font-size: 18px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(128, 128, 128, 0.1);
  }
`;

const NewProjectButton = styled(Link)`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    background-color: #3a80d2;
    text-decoration: none;
  }
`;

const Navbar = ({ toggleSidebar }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <NavbarContainer>
      <Logo>
        <FontAwesomeIcon icon={faVideo} />
        YouTube Clipper Pro
      </Logo>
      
      <NavItems>
        <NavItem to="/" active={location.pathname === '/' ? 1 : 0}>
          <FontAwesomeIcon icon={faHome} />
          Dashboard
        </NavItem>
        
        <NavItem to="/editor" active={location.pathname.includes('/editor') ? 1 : 0}>
          <FontAwesomeIcon icon={faEdit} />
          Editor
        </NavItem>
        
        <NavItem to="/projects" active={location.pathname === '/projects' ? 1 : 0}>
          <FontAwesomeIcon icon={faFolder} />
          Projects
        </NavItem>
        
        <NavItem to="/settings" active={location.pathname === '/settings' ? 1 : 0}>
          <FontAwesomeIcon icon={faGear} />
          Settings
        </NavItem>
      </NavItems>
      
      <NavControls>
        <NewProjectButton to="/editor/new">
          <FontAwesomeIcon icon={faPlus} />
          New Project
        </NewProjectButton>
        
        <IconButton onClick={toggleTheme} title={theme.id === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <FontAwesomeIcon icon={theme.id === 'dark' ? faSun : faMoon} />
        </IconButton>
        
        <IconButton onClick={toggleSidebar} title="Toggle sidebar">
          <FontAwesomeIcon icon={faBars} />
        </IconButton>
      </NavControls>
    </NavbarContainer>
  );
};

export default Navbar; 