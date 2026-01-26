/**
 * Admin System Stats Component
 * Displays system-wide statistics
 */

import React from 'react';
import { cardStyles, textStyles } from '../../styles/componentStyles';
import { combineStyles } from '../../utils/styleHelpers';
import { formatCost } from '../../utils/aiCostCalculator';

interface SystemStats {
  totalUsers: number;
  totalFoodItems: number;
  totalShoppingLists: number;
  totalUserItems: number;
  totalAITokens: number;
  totalAIRequests: number;
  totalAICost: number;
}

interface AdminSystemStatsProps {
  stats: SystemStats;
}

export const AdminSystemStats: React.FC<AdminSystemStatsProps> = ({ stats }) => {
  const statCardStyle = combineStyles(
    cardStyles.base,
    { padding: '1.5rem' }
  );

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={combineStyles(textStyles.heading3, { margin: '0 0 1rem 0' })}>
        System Statistics
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Users</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.totalUsers}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Food Items</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.totalFoodItems}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Shopping Lists</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.totalShoppingLists}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total User Items</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.totalUserItems}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total AI Tokens</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.totalAITokens.toLocaleString()}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total AI Requests</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.totalAIRequests.toLocaleString()}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total AI Cost</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{formatCost(stats.totalAICost)}</div>
        </div>
      </div>
    </div>
  );
};
