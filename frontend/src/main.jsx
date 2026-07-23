import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AdminApp from './AdminApp.jsx';
import './index.css';

// Vários apelidos pra chegar no painel do Cadu, caso o navegador
// autocomplete/autocorrija a URL de forma inesperada.
const ADMIN_PATHS = ['/admin', '/adm', '/master'];
const currentPath = window.location.pathname.toLowerCase();
const isAdmin = ADMIN_PATHS.some((path) => currentPath.startsWith(path));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <AdminApp /> : <App />}
  </React.StrictMode>,
);
