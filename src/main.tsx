import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline support and immediate PWA updates
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New Tour 2.0 PWA version available.');
  },
  onOfflineReady() {
    console.log('Tour 2.0 PWA is ready for offline use.');
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
