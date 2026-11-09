import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import { App } from '@presentation/App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemento #root não encontrado no index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
