'use client';

import { ReactNode } from 'react';

export interface TabConfig {
  id: string;
  label: string;
  count?: number | null;
  icon?: ReactNode;
}

interface TabNavigationProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export default function TabNavigation({ tabs, activeTab, onTabChange, className = '' }: TabNavigationProps) {
  return (
    <>
      <ul className={`nav custom-tabs ${className}`} style={{ borderBottom: 'none' }}>
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.id} style={{ marginBottom: 0 }}>
            <button
              className={`nav-link custom-tab-link${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              style={{ border: 'none', background: 'none', borderRadius: 0 }}
            >
              {tab.icon && <span className="me-2">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span className="badge bg-secondary ms-2">
                  {tab.count}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <style jsx global>{`
        .custom-tabs {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #222831;
          background: none;
          margin-bottom: 0.5rem;
        }
        .custom-tab-link {
          color: #b0b8c1;
          font-weight: 500;
          padding: 0.5rem 1.25rem 0.5rem 1.25rem;
          border: none;
          background: none;
          border-bottom: 2px solid transparent;
          transition: color 0.2s, border-bottom 0.2s;
        }
        .custom-tab-link:hover {
          color: #007bff;
          background: none;
          border-bottom: 2px solid #007bff33;
        }
        .custom-tab-link.active {
          color: #007bff;
          font-weight: 700;
          border-bottom: 2.5px solid #007bff;
          background: none;
        }
        .custom-tab-link .badge {
          font-size: 0.85em;
          margin-left: 0.5em;
        }
      `}</style>
    </>
  );
} 