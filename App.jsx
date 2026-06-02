import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Timeline from './components/Timeline';
import Contact from './components/Contact';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  const [view, setView] = useState(window.location.pathname === '/admin' ? 'admin' : 'portfolio');
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleLocationChange = () => {
      setView(window.location.pathname === '/admin' ? 'admin' : 'portfolio');
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setView(path === '/admin' ? 'admin' : 'portfolio');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Check if token is valid on mount
  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem('admin_token');
          setToken('');
        }
      })
      .catch(() => {
        // Network offline or server starting, keep token locally for now
      });
    }
  }, [token]);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
    showToast('Logged in successfully!');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    showToast('Logged out.');
    navigateTo('/');
  };

  return (
    <div className="app-container">
      <div className="glow-bg glow-1"></div>
      <div className="glow-bg glow-2"></div>

      {toast && (
        <div className={`toast toast-${toast.type}`} id="global-toast">
          <span>{toast.message}</span>
        </div>
      )}

      {view === 'portfolio' ? (
        <>
          <Navbar navigateTo={navigateTo} activeView={view} />
          <main>
            <section id="hero">
              <Hero navigateTo={navigateTo} />
            </section>
            
            <section id="projects" className="section">
              <Projects showToast={showToast} />
            </section>
            
            <section id="skills" className="section">
              <Skills />
            </section>
            
            <section id="experience" className="section">
              <div className="container">
                <h2 className="section-title">My Journey</h2>
                <p className="section-subtitle">Education, career highlights, and major milestones that shaped my professional expertise.</p>
                <Timeline />
              </div>
            </section>
            
            <section id="contact" className="section">
              <Contact showToast={showToast} />
            </section>
          </main>
          
          <footer className="footer">
            <div className="container footer-content">
              <ul className="footer-links">
                <li><a href="#hero">Home</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#skills">Skills</a></li>
                <li><a href="#experience">Journey</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
              <p style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
                &copy; {new Date().getFullYear()} Sai Teja. All rights reserved. |{' '}
                <button 
                  id="admin-gateway-btn"
                  onClick={() => navigateTo('/admin')} 
                  style={{
                    background: 'none', 
                    border: 'none', 
                    color: 'inherit', 
                    cursor: 'pointer', 
                    textDecoration: 'underline',
                    fontFamily: 'inherit',
                    fontSize: 'inherit'
                  }}
                >
                  Admin Gateway
                </button>
              </p>
            </div>
          </footer>
        </>
      ) : (
        <>
          <nav className="navbar">
            <div className="container">
              <button 
                onClick={() => navigateTo('/')} 
                className="logo" 
                style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit'}}
              >
                SAI TEJA <span>PORTFOLIO</span>
              </button>
              <button className="btn btn-secondary" onClick={() => navigateTo('/')}>Back to Site</button>
            </div>
          </nav>
          <div style={{ minHeight: 'calc(100vh - 70px)' }}>
            {token ? (
              <AdminDashboard token={token} onLogout={handleLogout} showToast={showToast} />
            ) : (
              <AdminLogin onLoginSuccess={handleLoginSuccess} showToast={showToast} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
