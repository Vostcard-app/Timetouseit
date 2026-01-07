/**
 * DashboardTabs Component
 * Storage type tabs (Perishable/Dry Canned)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { StorageTabType } from '../../hooks/useStorageTabs';

interface DashboardTabsProps {
  storageTab: StorageTabType;
  onTabChange: (tab: StorageTabType) => void;
  perishableCount: number;
  dryCannedCount: number;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  storageTab,
  onTabChange,
  perishableCount,
  dryCannedCount
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        onClick={() => onTabChange('perishable')}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: storageTab === 'perishable' ? '#002B4D' : '#f9fafb',
          color: storageTab === 'perishable' ? 'white' : '#1f2937',
          border: storageTab === 'perishable' ? '3px solid #002B4D' : '2px solid #d1d5db',
          borderBottom: storageTab === 'perishable' ? '4px solid #002B4D' : '2px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: storageTab === 'perishable' ? '600' : '500',
          cursor: 'pointer',
          flex: 1,
          minWidth: '150px',
          boxShadow: storageTab === 'perishable' ? '0 3px 6px rgba(0, 43, 77, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease'
        }}
      >
        Perishable ({perishableCount})
      </button>
      <button
        onClick={() => onTabChange('dryCanned')}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: storageTab === 'dryCanned' ? '#002B4D' : '#f9fafb',
          color: storageTab === 'dryCanned' ? 'white' : '#1f2937',
          border: storageTab === 'dryCanned' ? '3px solid #002B4D' : '2px solid #d1d5db',
          borderBottom: storageTab === 'dryCanned' ? '4px solid #002B4D' : '2px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: storageTab === 'dryCanned' ? '600' : '500',
          cursor: 'pointer',
          flex: 1,
          minWidth: '150px',
          boxShadow: storageTab === 'dryCanned' ? '0 3px 6px rgba(0, 43, 77, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease'
        }}
      >
        Dry/Canned ({dryCannedCount})
      </button>
      <span style={{ 
        fontSize: '1.25rem', 
        color: '#6b7280', 
        marginRight: '0.75rem',
        alignSelf: 'center',
        fontWeight: '700',
        fontStyle: 'italic'
      }}>
        Tap + hold to remove items
      </span>
      <button
        onClick={() => navigate('/add', { 
          state: { 
            storageType: storageTab === 'perishable' ? 'refrigerator' : 'pantry' 
          } 
        })}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#002B4D',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: '500',
          cursor: 'pointer',
          marginLeft: 'auto'
        }}
      >
        Add
      </button>
    </div>
  );
};

