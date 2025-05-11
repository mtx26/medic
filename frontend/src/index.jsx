import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { UserProvider } from "./contexts/UserContext";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
      <App />
  </UserProvider>
);