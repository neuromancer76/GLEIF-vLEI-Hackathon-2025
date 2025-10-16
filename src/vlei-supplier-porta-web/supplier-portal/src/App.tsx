import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CompanyLogin } from './components/CompanyLogin';
import { CompanyDashboard } from './components/CompanyDashboard';
import { SupplierLogin } from './components/SupplierLogin';
import { SupplierPortal } from './components/SupplierPortal';
import { Footer } from './components/Footer';
import type { CompanyData } from './types/api';
import './styles/amazon.css';

function CompanyApp() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'dashboard'>('login');

  // Restore company data from localStorage on app start
  useEffect(() => {
    const storedCompanyData = localStorage.getItem('companyData');
    if (storedCompanyData) {
      try {
        const parsedData: CompanyData = JSON.parse(storedCompanyData);
        setCompany(parsedData);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error parsing stored company data:', error);
        localStorage.removeItem('companyData');
      }
    }
  }, []);

  const handleLogin = (companyData: CompanyData) => {
    setCompany(companyData);
    setCurrentView('dashboard');
    
    // Store company data in localStorage for persistence
    localStorage.setItem('companyData', JSON.stringify(companyData));
  };

  const handleLogout = () => {
    setCompany(null);
    setCurrentView('login');
    
    // Clear stored company data
    localStorage.removeItem('companyData');
  };

  return (
    <div className="app">
      {currentView === 'login' ? (
        <>
          <header className="header">
            <div className="container">
              <div className="header-content">
                <a href="#" className="logo">
                  <img 
                    src="/assets/trustsphere_transparent_vlei.png" 
                    alt="VLEI Ecosystem Agentic Framework" 
                    style={{ height: '50px', width: 'auto' }}
                  />
                </a>
              </div>
            </div>
          </header>
          <main style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '2rem' }}>
            <CompanyLogin onLogin={handleLogin} />
          </main>
          <Footer />
        </>
      ) : (
        company && (
          <CompanyDashboard 
            company={company}
            onLogout={handleLogout}
          />
        )
      )}
    </div>
  );
}

function SupplierApp() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const urlSupplierLei = urlParams.get('lei'); // LEI from URL (optional after login)
  
  const [_supplierData, setSupplierData] = useState<CompanyData | null>(null);
  const [supplierLei, setSupplierLei] = useState<string | null>(urlSupplierLei);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Restore supplier session from localStorage
  useEffect(() => {
    const storedSupplierData = localStorage.getItem(`supplierData_${orderId}`);
    const storedSupplierLei = localStorage.getItem(`supplierLei_${orderId}`);
    
    if (storedSupplierData && storedSupplierLei && orderId) {
      try {
        const parsedData: CompanyData = JSON.parse(storedSupplierData);
        setSupplierData(parsedData);
        setSupplierLei(storedSupplierLei);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored supplier data:', error);
        localStorage.removeItem(`supplierData_${orderId}`);
        localStorage.removeItem(`supplierLei_${orderId}`);
      }
    }
  }, [orderId]);

  const handleLogin = (data: CompanyData, lei: string) => {
    setSupplierData(data);
    setSupplierLei(lei);
    setIsAuthenticated(true);
    
    // Store supplier session data
    if (orderId) {
      localStorage.setItem(`supplierData_${orderId}`, JSON.stringify(data));
      localStorage.setItem(`supplierLei_${orderId}`, lei);
    }
  };

  const handleLogout = () => {
    setSupplierData(null);
    setSupplierLei(null);
    setIsAuthenticated(false);
    
    // Clear stored supplier session
    if (orderId) {
      localStorage.removeItem(`supplierData_${orderId}`);
      localStorage.removeItem(`supplierLei_${orderId}`);
    }
  };

  if (!orderId) {
    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <div className="header-content">
              <a href="#" className="logo">
                <img 
                  src="/assets/trustsphere_transparent_vlei.png" 
                  alt="VLEI Supplier Portal" 
                  style={{ height: '50px', width: 'auto' }}
                />
              </a>
            </div>
          </div>
        </header>
        <main style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '2rem' }}>
          <div className="container">
            <div className="card">
              <div className="card-body text-center">
                <h3>Invalid Supplier Link</h3>
                <p>This supplier link is missing required parameters. Please use the link provided in your invitation email.</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !supplierLei) {
    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <div className="header-content">
              <a href="#" className="logo">
                <img 
                  src="/assets/trustsphere_transparent_vlei.png" 
                  alt="VLEI Supplier Portal" 
                  style={{ height: '50px', width: 'auto' }}
                />
              </a>
            </div>
          </div>
        </header>
        <main style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '2rem' }}>
          <SupplierLogin 
            orderId={orderId}
            supplierLei={urlSupplierLei}
            onLogin={handleLogin}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Show supplier portal after authentication
  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <a href="#" className="logo">
              <img 
                src="/assets/trustsphere_transparent_vlei.png" 
                alt="VLEI Supplier Portal" 
                style={{ height: '50px', width: 'auto' }}
              />
            </a>
            <nav className="nav-links">
              <span style={{ 
                color: 'var(--gleif-white)', 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '16px'
              }}>
                Supplier Application
              </span>
              <button 
                onClick={handleLogout}
                className="nav-link"
                style={{ 
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gleif-white)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '16px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
                </svg>
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>
      <main style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '2rem' }}>
        <SupplierPortal 
          orderId={orderId}
          supplierLei={supplierLei}
        />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/supplier" element={<SupplierApp />} />
        <Route path="/company" element={<CompanyApp />} />
        <Route path="/" element={<Navigate to="/company" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
