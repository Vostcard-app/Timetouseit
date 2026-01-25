/**
 * Admin User Management Component
 * Displays and manages users with delete, auth status, and cleanup functionality
 */

import React, { useState } from 'react';
import { adminService } from '../../services/adminService';
import { showToast } from '../Toast';
import { buttonStyles, cardStyles, combineStyles } from '../../styles/componentStyles';
import { textStyles } from '../../styles/componentStyles';
import { colors } from '../../styles/designTokens';

export interface UserInfo {
  uid: string;
  email?: string;
  username?: string;
  foodItemsCount: number;
  userItemsCount: number;
  existsInAuth?: boolean;
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    requestCount: number;
  };
}

interface AdminUserManagementProps {
  users: UserInfo[];
  loading: boolean;
  onUsersChange: (users: UserInfo[]) => void;
  onSystemStatsUpdate: () => Promise<void>;
  onPopulateEmails: () => Promise<void>;
  populatingEmails: boolean;
  cleaningUpOrphaned: boolean;
  onCleanupOrphaned: () => Promise<void>;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  users,
  loading,
  onUsersChange,
  onSystemStatsUpdate,
  onPopulateEmails,
  populatingEmails,
  cleaningUpOrphaned,
  onCleanupOrphaned,
}) => {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showOnlyAuthUsers, setShowOnlyAuthUsers] = useState(false);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(`Are you sure you want to delete all data for user ${userId}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await adminService.deleteUserData(userId);
      onUsersChange(users.filter(u => u.uid !== userId));
      await onSystemStatsUpdate();
      showToast('User deleted successfully', 'success');
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user data', 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  const orphanedCount = users.filter(u => u.existsInAuth === false).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={combineStyles(textStyles.heading3, { margin: 0 })}>
          User Management
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onPopulateEmails}
            disabled={populatingEmails}
            style={combineStyles(
              buttonStyles.success,
              populatingEmails && buttonStyles.disabled
            )}
          >
            {populatingEmails ? 'Populating...' : 'Populate Missing Emails/Usernames'}
          </button>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: colors.gray[700],
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={showOnlyAuthUsers}
              onChange={(e) => setShowOnlyAuthUsers(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Show only users in Auth
          </label>
          <button
            onClick={onCleanupOrphaned}
            disabled={cleaningUpOrphaned || orphanedCount === 0}
            style={combineStyles(
              buttonStyles.danger,
              (cleaningUpOrphaned || orphanedCount === 0) && buttonStyles.disabled
            )}
          >
            {cleaningUpOrphaned ? 'Cleaning up...' : `Delete Orphaned Users (${orphanedCount})`}
          </button>
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray[500] }}>
          <p>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray[500] }}>
          <p>No users found.</p>
        </div>
      ) : (
        <div style={cardStyles.base}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: colors.gray[50],
            borderBottom: `1px solid ${colors.gray[200]}`,
            fontWeight: 600,
            color: colors.gray[700],
            fontSize: '0.875rem'
          }}>
            <div>User ID</div>
            <div>Username</div>
            <div>Email</div>
            <div style={{ textAlign: 'center' }}>Food Items</div>
            <div style={{ textAlign: 'center' }}>User Items</div>
            <div style={{ textAlign: 'center' }}>AI Tokens</div>
            <div style={{ textAlign: 'center' }}>AI Requests</div>
            <div style={{ textAlign: 'center' }}>Auth Status</div>
            <div style={{ textAlign: 'center' }}>Actions</div>
          </div>
          {users
            .filter(userInfo => !showOnlyAuthUsers || userInfo.existsInAuth === true)
            .map((userInfo) => (
            <div
              key={userInfo.uid}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '1rem',
                padding: '1rem',
                borderBottom: `1px solid ${colors.gray[200]}`,
                alignItems: 'center'
              }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: colors.gray[900], wordBreak: 'break-all' }}>
                {userInfo.uid}
              </div>
              <div style={{ fontSize: '0.875rem', color: colors.gray[700] }}>
                {userInfo.username || 'Not available'}
              </div>
              <div style={{ fontSize: '0.875rem', color: colors.gray[700], wordBreak: 'break-all' }}>
                {userInfo.email || 'Not available'}
              </div>
              <div style={{ textAlign: 'center', color: colors.gray[500] }}>{userInfo.foodItemsCount}</div>
              <div style={{ textAlign: 'center', color: colors.gray[500] }}>{userInfo.userItemsCount}</div>
              <div style={{ textAlign: 'center', color: colors.gray[500], fontSize: '0.875rem' }}>
                {userInfo.tokenUsage ? userInfo.tokenUsage.totalTokens.toLocaleString() : '0'}
              </div>
              <div style={{ textAlign: 'center', color: colors.gray[500], fontSize: '0.875rem' }}>
                {userInfo.tokenUsage ? userInfo.tokenUsage.requestCount.toLocaleString() : '0'}
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                {userInfo.existsInAuth === undefined ? (
                  <span style={{ color: colors.gray[400] }}>Unknown</span>
                ) : userInfo.existsInAuth ? (
                  <span style={{ color: colors.success, fontWeight: 600 }}>✓ Active</span>
                ) : (
                  <span style={{ color: colors.error, fontWeight: 600 }}>✗ Orphaned</span>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => handleDeleteUser(userInfo.uid)}
                  disabled={deletingUserId === userInfo.uid}
                  style={combineStyles(
                    buttonStyles.danger,
                    deletingUserId === userInfo.uid && buttonStyles.disabled
                  )}
                >
                  {deletingUserId === userInfo.uid ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
