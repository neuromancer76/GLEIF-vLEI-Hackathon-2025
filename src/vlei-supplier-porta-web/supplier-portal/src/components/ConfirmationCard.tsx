import React, { useState } from 'react';
import type { PendingAction } from '../types/chat';
import ecosystemIcon from '../assets/ecosystem-icon.png';
import '../styles/confirmation-card.css';

interface ConfirmationCardProps {
  action: PendingAction;
  onConfirm: (actionId: string) => void;
  onReject: (actionId: string) => void;
  isExecuting: boolean;
  isConfirmed?: boolean;
  isRejected?: boolean;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  action,
  onConfirm,
  onReject,
  isExecuting,
  isConfirmed = false,
  isRejected = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasArguments = action.arguments && Object.keys(action.arguments).length > 0;

  // Determine the card state class
  const cardClass = isConfirmed 
    ? 'confirmation-card confirmed' 
    : isRejected 
    ? 'confirmation-card rejected' 
    : 'confirmation-card';

  // Format time like chat messages
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cardClass}>
      {/* Collapsible header when confirmed/rejected */}
      {(isConfirmed || isRejected) && (
        <button 
          className="card-collapse-header"
          onClick={() => setIsCollapsed(!isCollapsed)}
          type="button"
        >
          <div className="card-title-inline">
            <img src={ecosystemIcon} alt="Ecosystem" className="title-icon" />
            <span>VLEI Ecosystem action - {action.functionName}</span>
          </div>
          <span className="collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
        </button>
      )}
      
      {/* Show full card when not confirmed/rejected OR when expanded */}
      {(!isConfirmed && !isRejected) || !isCollapsed ? (
        <>
          {!isConfirmed && !isRejected && (
            <div className="card-title">
              <img src={ecosystemIcon} alt="Ecosystem" className="title-icon" />
              <span>VLEI Ecosystem action</span>
            </div>
          )}
          
          <div className="card-body">
            {action.description && (
              <div className="field description">
                <div className="description-text">{action.description}</div>
              </div>
            )}
            
            {hasArguments && (
              <div className="field arguments-section">
                <button 
                  className="details-toggle"
                  onClick={() => setShowDetails(!showDetails)}
                  type="button"
                >
                  {showDetails ? '▼' : '▶'} View Arguments
                </button>
                {showDetails && (
                  <pre className="arguments">
                    {JSON.stringify(action.arguments, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
          
          <div className="card-actions">
            {isExecuting ? (
              <div className="executing">
                <span className="spinner">⏳</span> Executing...
              </div>
            ) : isConfirmed || isRejected ? (
              <div className="done-indicator">
                Done {formatTime(new Date(action.createdAt))}
              </div>
            ) : (
              <>
                <button 
                  className="btn-confirm" 
                  onClick={() => onConfirm(action.actionId)}
                  type="button"
                  title="Allow"
                >
                  ✓
                </button>
                <button 
                  className="btn-reject" 
                  onClick={() => onReject(action.actionId)}
                  type="button"
                  title="Deny"
                >
                  ✗
                </button>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
