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
    <ul className={`nav nav-tabs ${className}`}>
      {tabs.map((tab) => (
        <li className="nav-item" key={tab.id}>
          <button
            className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <span className="me-2">{tab.icon}</span>}
            {tab.label}
            {tab.count !== null && tab.count !== undefined && (
              <span className="badge bg-secondary ms-2">
                {tab.count}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
} 