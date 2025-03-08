import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useProject } from '../contexts/ProjectContext';

const LibraryContainer = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 10px 10px 40px;
  border-radius: 4px;
  border: 1px solid #444;
  background-color: #333;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #4a90e2;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  color: #999;
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  background-color: #252525;
  border-radius: 8px;
  margin-top: 20px;
`;

const ProjectCard = styled.div`
  background-color: #252525;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
`;

const ProjectThumbnail = styled.div`
  height: 160px;
  background-color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProjectInfo = styled.div`
  padding: 15px;
`;

const ProjectTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
`;

const ProjectMeta = styled.div`
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 12px;
`;

const ActionButtons = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${ProjectCard}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.delete ? '#e74c3c' : '#4a90e2'};
  }
`;

const CreateButton = styled(Link)`
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  
  &:hover {
    background-color: #3a80d2;
    text-decoration: none;
  }
`;

// Format date helper function
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

function ProjectLibrary() {
  const { projects, loadProjects, deleteProject } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Filter projects when search term or projects change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProjects(projects);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredProjects(
        projects.filter(project => 
          project.name.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, projects]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault(); // Prevent navigating to project
    e.stopPropagation(); // Prevent event bubbling
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject(projectId);
    }
  };

  return (
    <LibraryContainer>
      <Header>
        <Title>Project Library</Title>
        <div style={{ display: 'flex', gap: '15px' }}>
          <SearchContainer>
            <SearchIcon>
              <FontAwesomeIcon icon={faSearch} />
            </SearchIcon>
            <SearchInput 
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </SearchContainer>
          <CreateButton to="/editor">
            <FontAwesomeIcon icon={faPlus} />
            New Project
          </CreateButton>
        </div>
      </Header>

      {filteredProjects.length > 0 ? (
        <ProjectGrid>
          {filteredProjects.map(project => (
            <ProjectCard key={project.id}>
              <Link to={`/editor/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <ProjectThumbnail>
                  {project.thumbnailUrl ? (
                    <img src={project.thumbnailUrl} alt={project.name} />
                  ) : (
                    <span>{project.name.substring(0, 1).toUpperCase()}</span>
                  )}
                  <ActionButtons>
                    <ActionButton as={Link} to={`/editor/${project.id}`}>
                      <FontAwesomeIcon icon={faEdit} />
                    </ActionButton>
                    <ActionButton 
                      delete 
                      onClick={(e) => handleDeleteProject(e, project.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </ActionButton>
                  </ActionButtons>
                </ProjectThumbnail>
                <ProjectInfo>
                  <ProjectTitle>{project.name}</ProjectTitle>
                  <ProjectMeta>
                    <span>Created: {formatDate(project.createdAt)}</span>
                    <span>Modified: {formatDate(project.updatedAt)}</span>
                  </ProjectMeta>
                </ProjectInfo>
              </Link>
            </ProjectCard>
          ))}
        </ProjectGrid>
      ) : (
        <EmptyState>
          <h2>No Projects Found</h2>
          {searchTerm ? (
            <p>No projects match your search. Try with different keywords.</p>
          ) : (
            <p>You don't have any projects yet. Create one to get started!</p>
          )}
          <CreateButton to="/editor" style={{ margin: '20px auto', display: 'inline-flex' }}>
            <FontAwesomeIcon icon={faPlus} />
            Create New Project
          </CreateButton>
        </EmptyState>
      )}
    </LibraryContainer>
  );
}

export default ProjectLibrary; 