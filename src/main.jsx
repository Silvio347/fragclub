import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App, { ROUTER_FUTURE } from './App';
// CSS global num arquivo só: classes compartilhadas entre páginas continuam
// disponíveis mesmo com as páginas carregadas sob demanda (React.lazy)
import './styles.css';
import './styles/landing.css';
import './styles/auth.css';
import './styles/play.css';
import './styles/premium.css';
import './styles/match-details.css';
import './styles/teams.css';
import './styles/shop.css';
import './styles/edit-profile.css';
import './styles/v3.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={ROUTER_FUTURE}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
