import React, { useState } from 'react';
import { OrdersList } from './OrdersList';
import { OrderDetailsComponent } from './OrderDetails';
import { CreateOrder } from './CreateOrder';
import { Chatbot } from './Chatbot';
import { Footer } from './Footer';
import { NotificationsPanel } from './NotificationsPanel';
import { useNotifications } from '../hooks/useNotifications';
import ecosystemIcon from '../assets/ecosystem-icon.png';
import type { CompanyData } from '../types/api';
import '../styles/dashboard.css';
import '../styles/notifications.css';

/**
 * Company Dashboard - Main Application Interface for VLEI-Enabled Procurement
 * 
 * This component serves as the central hub for companies participating in the VLEI ecosystem,
 * providing dual-tab navigation between company information management and supplier portal operations.
 * 
 * ARCHITECTURAL DESIGN DECISIONS:
 * 
 * 1. Dual-Actor Architecture: Supports both "company administrator" and "procurement officer" personas
 *    - Home Tab: Company data verification, VLEI credential management, administrative functions
 *    - Supplier Portal Tab: Active procurement workflows, order management, supplier discovery
 * 
 * 2. State Management Strategy: Uses controlled component pattern with local state management
 *    - Tab switching preserves context and user navigation state
 *    - Order details maintain drill-down navigation patterns
 *    - Notifications system provides real-time updates across all workflows
 * 
 * 3. VLEI Integration Points:
 *    - Company data loaded from VLEI credentials (LEI, legal name, jurisdiction)
 *    - OOBI (Out-Of-Band Introduction) support for KERI protocol integration
 *    - Prefix-based identity verification for cryptographic operations
 * 
 * 4. UX Patterns:
 *    - Responsive design with mobile-first approach
 *    - Collapsible sections for information density management
 *    - Real-time notifications with badge indicators
 *    - Context-aware AI chatbot integration
 * 
 * 5. Security Considerations:
 *    - LEI-based authentication and authorization
 *    - Secure credential presentation workflows
 *    - Audit trail through comprehensive logging
 */

export interface CompanyDashboardProps {
  company: CompanyData;  // VLEI-verified company data loaded from trusted credentials
  onLogout: () => void;  // Secure session termination callback
}

// Type definitions for navigation state management
type TabView = 'home' | 'supplier-portal';
type SupplierView = 'orders' | 'orderDetails' | 'createOrder';

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ company, onLogout }) => {
  
  // =============================================================================
  // State Management - Carefully designed to support complex navigation patterns
  // =============================================================================
  
  /** Primary tab navigation state (Home vs Supplier Portal) */
  const [activeTab, setActiveTab] = useState<TabView>('home');
  
  /** Secondary navigation within Supplier Portal tab */
  const [supplierView, setSupplierView] = useState<SupplierView>('orders');
  
  /** Currently selected order for drill-down navigation */
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  
  /** Mobile menu visibility state */
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  /** Notifications panel visibility state */
  const [showNotifications, setShowNotifications] = useState(false);
  
  /** Collapsible sections state for information density management */
  const [expandedSections, setExpandedSections] = useState({
    general: false,    // Company general information (LEI, creation date, jurisdiction)
    address: false,    // Legal entity address information
    technical: false   // VLEI technical details (OOBI, prefix, credentials)
  });

  // =============================================================================
  // Notifications Integration - Real-time updates for procurement workflows
  // =============================================================================
  
  /**
   * Custom hook for managing notifications with automatic polling and state synchronization.
   * Uses company LEI as the unique identifier for notification targeting, ensuring
   * that notifications are properly scoped to the authenticated legal entity.
   */
  const {
    notifications,
    notificationCount,
    isLoading: notificationsLoading,
    error: notificationsError,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    refresh: refreshNotifications
  } = useNotifications(company.lei);

  // Debug logging for notification state tracking
  console.log('Dashboard: notificationCount =', notificationCount);

  const toggleSection = (section: 'general' | 'address' | 'technical') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSupplierView('orderDetails');
  };

  const handleCreateOrder = () => {
    setSupplierView('createOrder');
  };

  const handleBackToOrders = () => {
    setSupplierView('orders');
    setSelectedOrderId('');
  };

  const handleOrderCreated = () => {
    setSupplierView('orders');
    // Refresh notifications when a new order is created
    setTimeout(() => {
      refreshNotifications();
    }, 1000); // Delay to ensure backend has processed the notification
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
    if (!notifications.length) {
      fetchNotifications();
    }
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const handleViewOrder = (orderId: string) => {
    setShowNotifications(false);
    setSelectedOrderId(orderId);
    setSupplierView('orderDetails');
    setActiveTab('supplier-portal');
  };

  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    // Reset supplier portal view when switching tabs
    if (tab === 'supplier-portal') {
      setSupplierView('orders');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <img src={ecosystemIcon} alt="Ecosystem" className="ecosystem-icon" />
          <div>
            <h1 className="dashboard-title">Trustsphere</h1>
            <p className="dashboard-subtitle">Where Trust Meets Technology—Around You.</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="company-name">{company.legalName}</span>
            <span className="lei-badge">LEI: {company.lei}</span>
          </div>
          
          {/* Notification Bell Button */}
          <button 
            className="header-notification-btn"
            onClick={handleNotificationClick}
            title={notificationCount > 0 ? `${notificationCount} new notifications` : "View notifications"}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
            </svg>
            {notificationCount > 0 && (
              <span className="header-notification-count">{notificationCount > 99 ? '99+' : notificationCount}</span>
            )}
          </button>
          
          <div className="menu-container">
            <button 
              className="menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="currentColor"/>
              </svg>
            </button>
            {isMenuOpen && (
              <div className="menu-dropdown">
                <button 
                  className={`menu-item ${activeTab === 'home' ? 'active' : ''}`}
                  onClick={() => handleTabChange('home')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
                  </svg>
                  Home
                </button>
                <button 
                  className={`menu-item ${activeTab === 'supplier-portal' ? 'active' : ''}`}
                  onClick={() => handleTabChange('supplier-portal')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z" fill="currentColor"/>
                  </svg>
                  Supplier Portal
                </button>
                <div className="menu-divider"></div>
                <button className="menu-item logout" onClick={onLogout}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => handleTabChange('home')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
          </svg>
          Home
        </button>
        <button 
          className={`tab-button ${activeTab === 'supplier-portal' ? 'active' : ''}`}
          onClick={() => handleTabChange('supplier-portal')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z" fill="currentColor"/>
          </svg>
          Supplier Portal
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'home' && (
          <div className="home-tab">
            <div className="container">
              <div className="welcome-banner">
                <h2>Welcome to VLEI Ecosystem</h2>
                <p>AI Meets VLEI: Making Your Ecosystem Visible, Accessible, and Smart</p>
              </div>

              {/* Company Information Card */}
              <div className="card company-info-card">
                <div className="card-header">
                  <h2>Your Company</h2>
                </div>
                <div className="card-body">
                  {/* Always Visible: Legal Name */}
                  <div className="info-item" style={{ marginBottom: '20px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
                    <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z" fill="currentColor"/>
                    </svg>
                    <div className="info-content">
                      <label>Legal Name</label>
                      <span>{company.legalName}</span>
                    </div>
                  </div>

                  <div className="info-grid">
                    {/* General Information - Collapsible */}
                    <div className="info-section">
                      <h3 
                        onClick={() => toggleSection('general')} 
                        className="collapsible-header"
                      >
                        <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M11 17H13V11H11V17ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 9H13V7H11V9Z" fill="currentColor"/>
                        </svg>
                        <span className="section-title">General Information</span>
                        <span className="toggle-arrow">{expandedSections.general ? '▼' : '▶'}</span>
                      </h3>
                      {expandedSections.general && (
                        <>
                          <div className="info-item">
                            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="currentColor"/>
                            </svg>
                            <div className="info-content">
                              <label>LEI</label>
                              <span className="lei-code">{company.lei}</span>
                            </div>
                          </div>
                          <div className="info-item">
                            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
                            </svg>
                            <div className="info-content">
                              <label>Creation Date</label>
                              <span>{formatDate(company.creationDate)}</span>
                            </div>
                          </div>
                          <div className="info-item">
                            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM7 9C7 6.24 9.24 4 12 4C14.76 4 17 6.24 17 9C17 11.88 14.12 16.19 12 18.88C9.92 16.21 7 11.85 7 9Z" fill="currentColor"/>
                              <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
                            </svg>
                            <div className="info-content">
                              <label>Jurisdiction</label>
                              <span>{company.jurisdiction}</span>
                            </div>
                          </div>
                          <div className="info-item">
                            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M12.87 15.07L10.33 12.56L10.36 12.53C12.1 10.59 13.34 8.36 14.07 6H17V4H10V2H8V4H1V6H12.17C11.5 7.92 10.44 9.75 9 11.35C8.07 10.32 7.3 9.19 6.69 8H4.69C5.42 9.63 6.42 11.17 7.67 12.56L2.58 17.58L4 19L9 14L12.11 17.11L12.87 15.07ZM18.5 10H16.5L12 22H14L15.12 19H19.87L21 22H23L18.5 10ZM15.88 17L17.5 12.67L19.12 17H15.88Z" fill="currentColor"/>
                            </svg>
                            <div className="info-content">
                              <label>Language</label>
                              <span>{company.language}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Address - Collapsible */}
                    <div className="info-section">
                      <h3 
                        onClick={() => toggleSection('address')} 
                        className="collapsible-header"
                      >
                        <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
                        </svg>
                        <span className="section-title">Address</span>
                        <span className="toggle-arrow">{expandedSections.address ? '▼' : '▶'}</span>
                      </h3>
                      {expandedSections.address && (
                        <div className="info-item address-item">
                          <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
                          </svg>
                          <div className="address-block">
                            {company.primaryAddress.addressLines.map((line, index) => (
                              <div key={index}>{line}</div>
                            ))}
                            <div>{company.primaryAddress.city}, {company.primaryAddress.region} {company.primaryAddress.postalCode}</div>
                            <div>{company.primaryAddress.country}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Technical Details - Collapsible */}
                    <div className="info-section">
                      <h3 
                        onClick={() => toggleSection('technical')} 
                        className="collapsible-header"
                      >
                        <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="currentColor"/>
                        </svg>
                        <span className="section-title">Technical Details</span>
                        <span className="toggle-arrow">{expandedSections.technical ? '▼' : '▶'}</span>
                      </h3>
                      {expandedSections.technical && (
                        <>
                          {company.alternativeNames && company.alternativeNames.length > 0 && (
                            <div className="info-item">
                              <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
                              </svg>
                              <div className="info-content">
                                <label>Alternative Names</label>
                                <span>{company.alternativeNames.join(', ')}</span>
                              </div>
                            </div>
                          )}
                          <div className="info-item">
                            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="currentColor"/>
                            </svg>
                            <div className="info-content">
                              <label>OOBI</label>
                              <span className="oobi-code">{company.oobi}</span>
                            </div>
                          </div>
                          <div className="info-item">
                            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M9.4 16.6L4.8 12L3.4 13.4L9.4 19.4L20.6 8.2L19.2 6.8L9.4 16.6Z" fill="currentColor"/>
                            </svg>
                            <div className="info-content">
                              <label>Prefix</label>
                              <span className="prefix-code">{company.prefix}</span>
                            </div>
                          </div>
                          <div className="info-item">
                            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
                            </svg>
                            <div className="info-content">
                              <label>Data Retrieved</label>
                              <span>{new Date(company.retrievedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                  <button 
                    className="action-card"
                    onClick={() => handleTabChange('supplier-portal')}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z" fill="currentColor"/>
                    </svg>
                    <h4>View Orders</h4>
                    <p>Manage your supplier orders</p>
                  </button>
                  <button 
                    className="action-card"
                    onClick={() => {
                      handleTabChange('supplier-portal');
                      setTimeout(() => handleCreateOrder(), 100);
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                    </svg>
                    <h4>Create New Order</h4>
                    <p>Start a new procurement order</p>
                  </button>
                  <button className="action-card">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                    </svg>
                    <h4>AI Assistant</h4>
                    <p>Get help from AI chatbot</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Chatbot on Home Tab */}
            <Chatbot 
              company={company} 
              context={{ 
                page: 'home',
                tab: 'home'
              }}
            />
          </div>
        )}

        {activeTab === 'supplier-portal' && (
          <div className="supplier-portal-tab">
            {supplierView === 'orders' && (
              <>

                <OrdersList 
                  company={company}
                  onSelectOrder={handleSelectOrder}
                  onCreateOrder={handleCreateOrder}
                />
              </>
            )}
            
            {supplierView === 'orderDetails' && selectedOrderId && (
              <OrderDetailsComponent 
                orderId={selectedOrderId}
                onBack={handleBackToOrders}
              />
            )}
            
            {supplierView === 'createOrder' && (
              <CreateOrder 
                company={company}
                onBack={handleBackToOrders}
                onOrderCreated={handleOrderCreated}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <Footer />
      
      {/* Notifications Panel */}
      {showNotifications && (
        <NotificationsPanel
          notifications={notifications}
          isLoading={notificationsLoading}
          error={notificationsError}
          onMarkAllAsRead={markAllAsRead}
          onMarkAsRead={markAsRead}
          onClose={handleCloseNotifications}
          onViewOrder={handleViewOrder}
        />
      )}
    </div>
  );
};
