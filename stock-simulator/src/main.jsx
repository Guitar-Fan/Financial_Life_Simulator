import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import eruda from 'eruda';

// Initialize eruda for debugging
if (import.meta.env.DEV || window.location.search.includes('eruda=true')) {
  eruda.init();
}

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
