/**
 * DashboardHeader Component
 * Banner, navigation buttons, and filters
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '../layout/Banner';

type FilterType = 'all' | 'bestBySoon' | 'pastBestBy';

interface DashboardHeaderProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  totalItems: number;
  expiringSoonCount: number; // Maps to bestBySoonCount
  expiredCount: number; // Maps to pastBestByCount
  onMenuClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  filter,
  onFilterChange,
  totalItems,
  expiringSoonCount,
  expiredCount,
  onMenuClick
}) => {
  const navigate = useNavigate();

  const getFilterCount = (filterType: FilterType): number => {
    if (filterType === 'all') return totalItems;
    if (filterType === 'bestBySoon') return expiringSoonCount;
    if (filterType === 'pastBestBy') return expiredCount;
    return 0;
  };

  return (
    <>
      <Banner onMenuClick={onMenuClick} />

      {/* Lists, Items, and Plan Buttons */}
      <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/shop')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#002B4D',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            flex: 1,
            maxWidth: '200px'
          }}
        >
          Shop
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#002B4D',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            flex: 1,
            maxWidth: '200px'
          }}
        >
          List Items
        </button>
        <button
          onClick={() => navigate('/planned-meal-calendar')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#002B4D',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            flex: 1,
            maxWidth: '200px'
          }}
        >
          Plan
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '5px', marginBottom: '5px', flexWrap: 'wrap', padding: '0 1rem' }}>
        {(['all', 'bestBySoon', 'pastBestBy'] as FilterType[]).map((filterType) => (
          <button
            key={filterType}
            onClick={() => onFilterChange(filterType)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filter === filterType ? '#002B4D' : '#f3f4f6',
              color: filter === filterType ? 'white' : '#1f2937',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {filterType === 'bestBySoon' ? 'Best By Soon' : filterType === 'pastBestBy' ? 'Past Best By' : 'All'} ({getFilterCount(filterType)})
          </button>
        ))}
      </div>

      {/* Today's Date */}
      <div style={{ marginBottom: '5px', padding: '2px 0', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>
    </>
  );
};

