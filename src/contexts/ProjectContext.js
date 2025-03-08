// src/contexts/ProjectContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create context
const ProjectContext = createContext();

// Provider component
export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load all projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      if (window.api) {
        const projectsData = await window.api.getProjects();
        setProjects(projectsData || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load a specific project
  const loadProject = useCallback(async (projectId) => {
    try {
      setLoading(true);
      if (projectId && window.api) {
        const projectsData = await window.api.getProjects();
        const project = projectsData.find(p => p.id === projectId);
        if (project) {
          setCurrentProject(project);
          return project;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new project
  const createProject = useCallback(async (projectData = {}) => {
    try {
      setLoading(true);
      const newProject = {
        id: uuidv4(),
        name: projectData.name || 'Untitled Project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: {
          clips: [],
          subtitles: [],
          audioTracks: []
        },
        videoSource: null,
        ...projectData
      };
      
      if (window.api) {
        await window.api.saveProject(newProject);
        setProjects(prev => [...prev, newProject]);
        setCurrentProject(newProject);
        return newProject;
      }
      return null;
    } catch (error) {
      console.error('Failed to create project:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save a project
  const saveProject = useCallback(async (projectData) => {
    try {
      setLoading(true);
      if (!projectData || !projectData.id) return null;
      
      const updatedProject = {
        ...projectData,
        updatedAt: new Date().toISOString()
      };
      
      if (window.api) {
        await window.api.saveProject(updatedProject);
        
        // Update projects list
        setProjects(prev => 
          prev.map(p => p.id === updatedProject.id ? updatedProject : p)
        );
        
        // Update current project if it's the one being saved
        if (currentProject && currentProject.id === updatedProject.id) {
          setCurrentProject(updatedProject);
        }
        
        return updatedProject;
      }
      return null;
    } catch (error) {
      console.error('Failed to save project:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  // Delete a project
  const deleteProject = useCallback(async (projectId) => {
    try {
      setLoading(true);
      if (!projectId) return false;
      
      if (window.api) {
        await window.api.deleteProject(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        // Clear current project if it's the one being deleted
        if (currentProject && currentProject.id === projectId) {
          setCurrentProject(null);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  // Value to be provided
  const contextValue = {
    projects,
    currentProject,
    loading,
    loadProjects,
    loadProject,
    createProject,
    saveProject,
    deleteProject,
    setCurrentProject
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook to use the project context
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
} 