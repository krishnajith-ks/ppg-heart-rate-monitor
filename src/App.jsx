// src/App.jsx - Application shell with router and hidden admin link
import React from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import Measure from './pages/Measure';
import About from './pages/About';
import Admin from './pages/Admin';

export default function App() {
  return (
    <div className="app-container">
      {/* Top Header & Public Navigation */}
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="pulse-icon">♥</span>
          <span>PPG Monitor</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Measure
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
            About
          </NavLink>
        </nav>
      </header>

      {/* Main Page Routing */}
      <Routes>
        <Route path="/" element={<Measure />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>

      {/* Footer with Hidden Admin Panel Link per GUIDE.md */}
      <footer className="app-footer">
        <p>
          <Link to="/admin" className="hidden-admin-link" title="Diagnostics Panel">
            © 2026 PPG Heart Rate Monitor • ECE DSP Project
          </Link>
        </p>
      </footer>
    </div>
  );
}
