/**
 * Admin Cost Breakdown Component
 * Displays detailed cost breakdown per user with monthly averages
 */

import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { cardStyles, combineStyles, textStyles } from '../../styles/componentStyles';
import { colors } from '../../styles/designTokens';
import { formatCost } from '../../utils/aiCostCalculator';
import type { UserInfo } from './AdminUserManagement';

export interface UserCostBreakdown {
  userId: string;
  email?: string;
  username?: string;
  totalTokens: number;
  totalCost: number;
  monthlyAverages: {
    last30Days: { tokens: number; cost: number };
    last3Months: { tokens: number; cost: number }; // average per month
    currentMonth: { tokens: number; cost: number };
  };
}

interface CostBreakdownSummary {
  totalUsers: number;
  totalTokens: number;
  totalCost: number;
  totalIncome?: number; // For future implementation
}

interface AdminCostBreakdownProps {
  users: UserInfo[];
  loading: boolean;
}

export const AdminCostBreakdown: React.FC<AdminCostBreakdownProps> = ({ users, loading }) => {
  const [costData, setCostData] = useState<UserCostBreakdown[]>([]);
  const [summary, setSummary] = useState<CostBreakdownSummary>({
    totalUsers: 0,
    totalTokens: 0,
    totalCost: 0
  });
  const [loadingCostData, setLoadingCostData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCostData = async () => {
      if (users.length === 0) {
        setCostData([]);
        setSummary({ totalUsers: 0, totalTokens: 0, totalCost: 0 });
        return;
      }

      setLoadingCostData(true);
      setError(null);

      try {
        const breakdown = await adminService.getUserCostBreakdown(users);
        
        // Calculate summary
        const totalUsers = breakdown.length;
        const totalTokens = breakdown.reduce((sum, user) => sum + user.totalTokens, 0);
        const totalCost = breakdown.reduce((sum, user) => sum + user.totalCost, 0);

        setCostData(breakdown);
        setSummary({
          totalUsers,
          totalTokens,
          totalCost
        });
      } catch (err) {
        console.error('Error loading cost breakdown:', err);
        setError('Failed to load cost breakdown data');
      } finally {
        setLoadingCostData(false);
      }
    };

    loadCostData();
  }, [users]);

  if (loading || loadingCostData) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray[500] }}>
        <p>Loading cost breakdown...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        color: '#991b1b',
        textAlign: 'center'
      }}>
        {error}
      </div>
    );
  }

  // Sort by total cost descending
  const sortedData = [...costData].sort((a, b) => b.totalCost - a.totalCost);

  return (
    <div>
      {/* Summary Section */}
      <div style={combineStyles(cardStyles.base, { marginBottom: '2rem' })}>
        <h3 style={combineStyles(textStyles.heading3, { margin: '0 0 1rem 0' })}>
          Summary
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: colors.gray[50],
            borderRadius: '8px',
            border: `1px solid ${colors.gray[200]}`
          }}>
            <div style={{ fontSize: '0.875rem', color: colors.gray[600], marginBottom: '0.5rem' }}>
              Users with AI Usage
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.gray[900] }}>
              {summary.totalUsers}
            </div>
          </div>
          <div style={{
            padding: '1rem',
            backgroundColor: colors.gray[50],
            borderRadius: '8px',
            border: `1px solid ${colors.gray[200]}`
          }}>
            <div style={{ fontSize: '0.875rem', color: colors.gray[600], marginBottom: '0.5rem' }}>
              Total Tokens Used
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.gray[900] }}>
              {summary.totalTokens.toLocaleString()}
            </div>
          </div>
          <div style={{
            padding: '1rem',
            backgroundColor: colors.gray[50],
            borderRadius: '8px',
            border: `1px solid ${colors.gray[200]}`
          }}>
            <div style={{ fontSize: '0.875rem', color: colors.gray[600], marginBottom: '0.5rem' }}>
              Total Cost
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.gray[900] }}>
              {formatCost(summary.totalCost)}
            </div>
          </div>
          {summary.totalIncome !== undefined && (
            <div style={{
              padding: '1rem',
              backgroundColor: colors.gray[50],
              borderRadius: '8px',
              border: `1px solid ${colors.gray[200]}`
            }}>
              <div style={{ fontSize: '0.875rem', color: colors.gray[600], marginBottom: '0.5rem' }}>
                Total Income
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.gray[900] }}>
                {formatCost(summary.totalIncome)}
              </div>
            </div>
          )}
          {summary.totalIncome !== undefined && (
            <div style={{
              padding: '1rem',
              backgroundColor: colors.gray[50],
              borderRadius: '8px',
              border: `1px solid ${colors.gray[200]}`
            }}>
              <div style={{ fontSize: '0.875rem', color: colors.gray[600], marginBottom: '0.5rem' }}>
                Profit Margin
              </div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: summary.totalIncome > summary.totalCost ? colors.success : colors.error 
              }}>
                {summary.totalCost > 0 
                  ? `${(((summary.totalIncome - summary.totalCost) / summary.totalCost) * 100).toFixed(1)}%`
                  : 'N/A'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Cost Breakdown Table */}
      <div style={cardStyles.base}>
        <h3 style={combineStyles(textStyles.heading3, { margin: '0 0 1rem 0' })}>
          Cost Breakdown by User
        </h3>
        
        {sortedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray[500] }}>
            <p>No AI usage data available.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: colors.gray[50],
              borderBottom: `1px solid ${colors.gray[200]}`,
              fontWeight: 600,
              color: colors.gray[700],
              fontSize: '0.875rem'
            }}>
              <div>Email</div>
              <div style={{ textAlign: 'center' }}>Total Tokens</div>
              <div style={{ textAlign: 'center' }}>Total Cost</div>
              <div style={{ textAlign: 'center' }}>Last 30 Days Avg</div>
              <div style={{ textAlign: 'center' }}>3 Month Avg</div>
              <div style={{ textAlign: 'center' }}>Current Month</div>
              <div style={{ textAlign: 'center' }}>Current Month Cost</div>
            </div>

            {/* Table Rows */}
            {sortedData.map((user) => (
              <div
                key={user.userId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: `1px solid ${colors.gray[200]}`,
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: '0.875rem', color: colors.gray[700], wordBreak: 'break-all' }}>
                  {user.email || 'Not available'}
                </div>
                <div style={{ textAlign: 'center', color: colors.gray[500], fontSize: '0.875rem' }}>
                  {user.totalTokens.toLocaleString()}
                </div>
                <div style={{ textAlign: 'center', color: colors.gray[500], fontSize: '0.875rem', fontWeight: 500 }}>
                  {formatCost(user.totalCost)}
                </div>
                <div style={{ textAlign: 'center', color: colors.gray[500], fontSize: '0.875rem' }}>
                  {user.monthlyAverages.last30Days.tokens > 0 
                    ? `${Math.round(user.monthlyAverages.last30Days.tokens).toLocaleString()} tokens`
                    : 'N/A'}
                </div>
                <div style={{ textAlign: 'center', color: colors.gray[500], fontSize: '0.875rem' }}>
                  {user.monthlyAverages.last3Months.tokens > 0
                    ? `${Math.round(user.monthlyAverages.last3Months.tokens).toLocaleString()} tokens`
                    : 'N/A'}
                </div>
                <div style={{ textAlign: 'center', color: colors.gray[500], fontSize: '0.875rem' }}>
                  {user.monthlyAverages.currentMonth.tokens > 0
                    ? `${user.monthlyAverages.currentMonth.tokens.toLocaleString()} tokens`
                    : 'N/A'}
                </div>
                <div style={{ textAlign: 'center', color: colors.gray[500], fontSize: '0.875rem', fontWeight: 500 }}>
                  {user.monthlyAverages.currentMonth.cost > 0
                    ? formatCost(user.monthlyAverages.currentMonth.cost)
                    : 'N/A'}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
