import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './pages/App';
import './styles/global.css';

// Render the application
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 