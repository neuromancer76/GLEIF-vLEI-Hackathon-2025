import React from 'react';
import '../styles/footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="powered-by">
          <span className="powered-by-text"></span>
          <img 
            src="/src/assets/gabbiano.png" 
            alt="Gabbiano" 
            className="gabbiano-logo"
          />
        </div>
      </div>
    </footer>
  );
};
