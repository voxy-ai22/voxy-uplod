
import React from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from './app/page';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <HomePage />
    </React.StrictMode>
  );
}
