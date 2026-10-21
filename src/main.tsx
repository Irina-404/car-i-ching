import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './fonts.css';
import './palettes.css';
import './colors.css';
import './typography.css';
import './styles.css';
import './prototype.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
