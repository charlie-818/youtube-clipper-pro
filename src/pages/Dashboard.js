import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faFolder, faVideo, faFileImport, 
  faClockRotateLeft, faStar
} from '@fortawesome/free-solid-svg-icons';
import { useProject } from '../contexts/ProjectContext';

const DashboardContainer = styled.div`
  padding: 20px;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0;
  color: var(--text-color);
  font-size: 24px;
`;

const ActionButton = styled(Link)`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
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

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const Card = styled.div`
  background-color: var(--background-secondary);
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px var(--shadow-color);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px var(--shadow-color);
  }
`;

const CardImage = styled.div`
  height: 160px;
  background-color: #555;
  position: relative;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CardContent = styled.div`
  padding: 16px;
`;

const CardTitle = styled.h3`
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 16px;
`;

const CardInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 12px;
`;

const CardDate = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SectionTitle = styled.h2`
  margin: 30px 0 16px 0;
  color: var(--text-color);
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmptyState = styled.div`
  background-color: var(--background-secondary);
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  color: var(--text-secondary);
  
  h3 {
    margin-top: 12px;
    margin-bottom: 8px;
    color: var(--text-color);
  }
  
  p {
    margin-bottom: 20px;
  }
  
  svg {
    font-size: 40px;
    opacity: 0.6;
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const Dashboard = () => {
  const { projects, loadProjects } = useProject();
  
  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <DashboardContainer>
      <DashboardHeader>
        <Title>Dashboard</Title>
        <ActionButton to="/editor/new">
          <FontAwesomeIcon icon={faPlus} />
          New Project
        </ActionButton>
      </DashboardHeader>
      
      <SectionTitle>
        <FontAwesomeIcon icon={faClockRotateLeft} />
        Recent Projects
      </SectionTitle>
      
      {projects.length > 0 ? (
        <CardGrid>
          {projects.slice(0, 6).map(project => (
            <Link key={project.id} to={`/editor/${project.id}`} style={{ textDecoration: 'none' }}>
              <Card>
                <CardImage>
                  {project.thumbnailUrl ? (
                    <img src={project.thumbnailUrl} alt={project.name} />
                  ) : null}
                </CardImage>
                <CardContent>
                  <CardTitle>{project.name}</CardTitle>
                  <CardInfo>
                    <CardDate>
                      <FontAwesomeIcon icon={faClockRotateLeft} />
                      {formatDate(project.updatedAt)}
                    </CardDate>
                    <span>{project.resolution}</span>
                  </CardInfo>
                </CardContent>
              </Card>
            </Link>
          ))}
        </CardGrid>
      ) : (
        <EmptyState>
          <FontAwesomeIcon icon={faFolder} />
          <h3>No Projects Yet</h3>
          <p>Create a new project or import a YouTube video to get started.</p>
          <ActionButtonsContainer>
            <ActionButton to="/editor/new">
              <FontAwesomeIcon icon={faPlus} />
              New Project
            </ActionButton>
            
            <ActionButton to="/import" style={{ backgroundColor: '#555' }}>
              <FontAwesomeIcon icon={faFileImport} />
              Import Video
            </ActionButton>
          </ActionButtonsContainer>
        </EmptyState>
      )}
      
      <SectionTitle>
        <FontAwesomeIcon icon={faStar} />
        Featured Templates
      </SectionTitle>
      
      <CardGrid>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardImage>
              {/* Placeholder thumbnail for templates */}
            </CardImage>
            <CardContent>
              <CardTitle>Video Template {index + 1}</CardTitle>
              <CardInfo>
                <span>Social Media</span>
                <span>1080p</span>
              </CardInfo>
            </CardContent>
          </Card>
        ))}
      </CardGrid>
    </DashboardContainer>
  );
};

export default Dashboard; 