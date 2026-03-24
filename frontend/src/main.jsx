import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Fade in once React has painted — eliminates white/black flash
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.getElementById('root')?.classList.add('ready');
  });
});
