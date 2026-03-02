import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Tooltip from '@radix-ui/react-tooltip';
import App from './App';
import { TutorialProvider } from './components/education/TutorialSystem';
import { BeginnerModeProvider } from './components/education/BeginnerMode';
import './index.css';

// Initialize eruda first for debugging, then render app
async function initApp() {
  // Conditionally load eruda for debugging
  if (import.meta.env.DEV || window.location.search.includes('eruda=true')) {
    try {
      const { default: eruda } = await import('eruda');
      eruda.init();
    } catch (e) {
      console.error('Failed to load eruda:', e);
    }
  }

  const root = createRoot(document.getElementById('root'));

  root.render(
    <React.StrictMode>
      <Tooltip.Provider delayDuration={300}>
        <BeginnerModeProvider>
          <TutorialProvider>
            <App />
          </TutorialProvider>
        </BeginnerModeProvider>
      </Tooltip.Provider>
    </React.StrictMode>
  );
}

initApp().catch(err => {
  console.error('Fatal error during init:', err);
  document.getElementById('root').innerHTML = `
    <div style="color: red; padding: 20px; font-family: monospace;">
      <h2>Initialization Error</h2>
      <pre>${err.message}\n${err.stack}</pre>
    </div>
  `;
});
