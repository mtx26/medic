import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from "./contexts/LoginContext";
import { UserProvider } from "./contexts/UserContext";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <AuthProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </AuthProvider>
);