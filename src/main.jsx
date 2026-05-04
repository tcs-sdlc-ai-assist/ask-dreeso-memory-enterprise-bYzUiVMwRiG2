import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getData } from '@/services/dataManager';

// Initialize mock data in localStorage on first load.
// getData triggers ensureInitialized() inside DataManager,
// which loads all default JSON data into localStorage if not yet present.
getData('personas');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);