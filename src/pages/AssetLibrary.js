import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, 
  faMusic, 
  faImage, 
  faVideo, 
  faFileAudio,
  faFilter,
  faSearch,
  faEllipsisV
} from '@fortawesome/free-solid-svg-icons';

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

const ActionButton = styled.button`
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #3a80d2;
  }
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

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const FilterButton = styled.button`
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover, &.active {
    background-color: #4a90e2;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const ViewOptions = styled.div`
  display: flex;
  gap: 10px;
`;

const ViewOption = styled.button`
  background-color: ${props => props.active ? '#4a90e2' : '#333'};
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.active ? '#4a90e2' : '#444'};
  }
`;

const AssetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

const AssetCard = styled.div`
  background-color: #252525;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
  
  &:hover .asset-actions {
    opacity: 1;
  }
`;

const AssetThumbnail = styled.div`
  height: 150px;
  background-color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  svg {
    font-size: 40px;
    opacity: 0.5;
  }
  
  img, video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AssetInfo = styled.div`
  padding: 12px;
`;

const AssetTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AssetMeta = styled.div`
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 12px;
`;

const AssetActions = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.2s;
`;

const ActionMenu = styled.button`
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
    background-color: #4a90e2;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  background-color: #252525;
  border-radius: 8px;
`;

// Sample assets for demonstration
const sampleAssets = [
  { id: 1, name: 'Background Music 1', type: 'audio', format: 'mp3', duration: '2:30', size: '4.2 MB' },
  { id: 2, name: 'Intro Animation', type: 'video', format: 'mp4', duration: '0:15', size: '8.7 MB' },
  { id: 3, name: 'Logo', type: 'image', format: 'png', size: '0.8 MB' },
  { id: 4, name: 'Narration Voice Over', type: 'audio', format: 'wav', duration: '1:45', size: '12.5 MB' },
  { id: 5, name: 'Product Shot', type: 'image', format: 'jpg', size: '2.3 MB' },
  { id: 6, name: 'Transition Effect', type: 'video', format: 'mp4', duration: '0:05', size: '3.1 MB' },
];

function AssetLibrary() {
  const [assets] = useState(sampleAssets);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filter assets based on search term and type filter
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || asset.type === activeFilter;
    return matchesSearch && matchesFilter;
  });
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };
  
  const handleUploadClick = () => {
    // In a real app, this would open a file picker dialog
    console.log('Upload button clicked');
    window.api.showOpenDialog({
      title: 'Select Files to Upload',
      buttonLabel: 'Upload',
      properties: ['openFile', 'multiSelections'],
    }).then(result => {
      if (!result.canceled) {
        console.log('Files selected:', result.filePaths);
        // Here you'd process the selected files
      }
    });
  };
  
  // Return appropriate icon based on asset type
  const getAssetIcon = (type) => {
    switch(type) {
      case 'audio': return <FontAwesomeIcon icon={faFileAudio} />;
      case 'video': return <FontAwesomeIcon icon={faVideo} />;
      case 'image': return <FontAwesomeIcon icon={faImage} />;
      default: return null;
    }
  };
  
  return (
    <LibraryContainer>
      <Header>
        <Title>Asset Library</Title>
        <div style={{ display: 'flex', gap: '15px' }}>
          <SearchContainer>
            <SearchIcon>
              <FontAwesomeIcon icon={faSearch} />
            </SearchIcon>
            <SearchInput 
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </SearchContainer>
          <ActionButton onClick={handleUploadClick}>
            <FontAwesomeIcon icon={faUpload} />
            Upload Asset
          </ActionButton>
        </div>
      </Header>
      
      <Toolbar>
        <FilterContainer>
          <FilterButton 
            className={activeFilter === 'all' ? 'active' : ''}
            onClick={() => handleFilterChange('all')}
          >
            <FontAwesomeIcon icon={faFilter} />
            All
          </FilterButton>
          <FilterButton 
            className={activeFilter === 'video' ? 'active' : ''}
            onClick={() => handleFilterChange('video')}
          >
            <FontAwesomeIcon icon={faVideo} />
            Video
          </FilterButton>
          <FilterButton 
            className={activeFilter === 'audio' ? 'active' : ''}
            onClick={() => handleFilterChange('audio')}
          >
            <FontAwesomeIcon icon={faMusic} />
            Audio
          </FilterButton>
          <FilterButton 
            className={activeFilter === 'image' ? 'active' : ''}
            onClick={() => handleFilterChange('image')}
          >
            <FontAwesomeIcon icon={faImage} />
            Images
          </FilterButton>
        </FilterContainer>
        
        <ViewOptions>
          {/* View toggle buttons would go here (grid/list view) */}
        </ViewOptions>
      </Toolbar>
      
      {filteredAssets.length > 0 ? (
        <AssetsGrid>
          {filteredAssets.map(asset => (
            <AssetCard key={asset.id}>
              <AssetThumbnail>
                {getAssetIcon(asset.type)}
                <AssetActions className="asset-actions">
                  <ActionMenu>
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </ActionMenu>
                </AssetActions>
              </AssetThumbnail>
              <AssetInfo>
                <AssetTitle>{asset.name}</AssetTitle>
                <AssetMeta>
                  <span>{asset.format.toUpperCase()}</span>
                  <span>{asset.duration ? asset.duration : asset.size}</span>
                </AssetMeta>
              </AssetInfo>
            </AssetCard>
          ))}
        </AssetsGrid>
      ) : (
        <EmptyState>
          <h2>No Assets Found</h2>
          {searchTerm || activeFilter !== 'all' ? (
            <p>No assets match your current filters. Try adjusting your search or filter criteria.</p>
          ) : (
            <p>Your library is empty. Upload assets to get started!</p>
          )}
          <ActionButton onClick={handleUploadClick} style={{ margin: '20px auto', display: 'inline-flex' }}>
            <FontAwesomeIcon icon={faUpload} />
            Upload Asset
          </ActionButton>
        </EmptyState>
      )}
    </LibraryContainer>
  );
}

export default AssetLibrary; 