import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './__app.js';

const container = document.getElementById('client');
const root = ReactDOM.createRoot(container);

root.render(<App />);
