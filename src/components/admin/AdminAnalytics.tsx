/**
 * Admin Analytics Component
 * Displays analytics dashboard with collapsible sections
 */

import React, { useState } from 'react';
import type { DashboardOverview, RetentionMetrics, FunnelMetrics, EngagementMetrics } from '../../types/analytics';
import { cardStyles, buttonStyles, combineStyles } from '../../styles/componentStyles';
import { textStyles } from '../../styles/componentStyles';
import { colors, spacing } from '../../styles/designTokens';

interface AdminAnalyticsProps {
  loading: boolean;
  error: string | null;
  overview: DashboardOverview | null;
  retention: RetentionMetrics | null;
  funnel: FunnelMetrics | null;
  engagement: EngagementMetrics | null;
  onRetry: () => void;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  loading,
  error,
  overview,
  retention,
  funnel,
  engagement,
  onRetry,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    acquisition: false,
    activation: false,
    retention: false,
    engagement: false,
    funnel: false,
    quality: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const metricCardStyle = {
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: '8px',
  };

  const sectionCardStyle = combineStyles(cardStyles.base, {
    marginBottom: spacing.lg,
  });

  const sectionHeaderStyle = {
    width: '100%',
    padding: `${spacing.md} ${spacing.lg}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.gray[700],
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray[500] }}>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={combineStyles(textStyles.heading3, { margin: 0 })}>
          Analytics Dashboard
        </h2>
        {error && (
          <button
            onClick={onRetry}
            style={combineStyles(buttonStyles.primary, { fontSize: '0.875rem' })}
          >
            Retry
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: spacing.md,
          backgroundColor: '#fee2e2',
          border: `1px solid ${colors.error}`,
          borderRadius: '8px',
          marginBottom: spacing.lg,
          color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      {/* Overview Section */}
      <div style={sectionCardStyle}>
        <button onClick={() => toggleSection('overview')} style={sectionHeaderStyle}>
          <span>Overview</span>
          <span style={{ fontSize: '1.5rem', color: colors.gray[500] }}>
            {expandedSections.overview ? '−' : '+'}
          </span>
        </button>
        {expandedSections.overview && (
          <div style={{ padding: `0 ${spacing.lg} ${spacing.lg} ${spacing.lg}` }}>
            {overview ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: spacing.md
              }}>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>New Users Today</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>{overview.newUsersToday}</div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>New Users This Week</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>{overview.newUsersThisWeek}</div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>New Users This Month</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>{overview.newUsersThisMonth}</div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Activation Rate</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: overview.activationRate > 50 ? colors.success : overview.activationRate > 25 ? colors.warning : colors.error }}>
                    {overview.activationRate.toFixed(1)}%
                  </div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Day 7 Retention</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: overview.day7Retention > 40 ? colors.success : overview.day7Retention > 20 ? colors.warning : colors.error }}>
                    {overview.day7Retention.toFixed(1)}%
                  </div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>WAU/MAU Ratio</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: overview.wauMauRatio > 0.5 ? colors.success : overview.wauMauRatio > 0.3 ? colors.warning : colors.error }}>
                    {overview.wauMauRatio.toFixed(2)}
                  </div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Avg Actions/Session</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>
                    {overview.averageActionsPerSession.toFixed(1)}
                  </div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Error Rate</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: overview.errorRate < 1 ? colors.success : overview.errorRate < 5 ? colors.warning : colors.error }}>
                    {overview.errorRate.toFixed(2)}%
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.gray[500] }}>
                No analytics data available yet. Metrics will appear as users interact with the app.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Retention Section */}
      <div style={sectionCardStyle}>
        <button onClick={() => toggleSection('retention')} style={sectionHeaderStyle}>
          <span>Retention</span>
          <span style={{ fontSize: '1.5rem', color: colors.gray[500] }}>
            {expandedSections.retention ? '−' : '+'}
          </span>
        </button>
        {expandedSections.retention && (
          <div style={{ padding: `0 ${spacing.lg} ${spacing.lg} ${spacing.lg}` }}>
            {retention ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: spacing.md
              }}>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Daily Active Users</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>{retention.dau}</div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Weekly Active Users</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>{retention.wau}</div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Monthly Active Users</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>{retention.mau}</div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Day 1 Retention</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>{retention.day1Retention.toFixed(1)}%</div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Day 7 Retention</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>{retention.day7Retention.toFixed(1)}%</div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Day 30 Retention</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>{retention.day30Retention.toFixed(1)}%</div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>WAU/MAU Ratio</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>{retention.wauMauRatio.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.gray[500] }}>
                No retention data available yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Engagement Section */}
      <div style={sectionCardStyle}>
        <button onClick={() => toggleSection('engagement')} style={sectionHeaderStyle}>
          <span>Engagement</span>
          <span style={{ fontSize: '1.5rem', color: colors.gray[500] }}>
            {expandedSections.engagement ? '−' : '+'}
          </span>
        </button>
        {expandedSections.engagement && (
          <div style={{ padding: `0 ${spacing.lg} ${spacing.lg} ${spacing.lg}` }}>
            {engagement ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: spacing.md,
                  marginBottom: spacing.lg
                }}>
                  <div style={metricCardStyle}>
                    <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Avg Actions/Session</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>
                      {engagement.averageActionsPerSession.toFixed(1)}
                    </div>
                  </div>
                  <div style={metricCardStyle}>
                    <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Avg Sessions/User</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: colors.gray[900] }}>
                      {engagement.averageSessionsPerUser.toFixed(1)}
                    </div>
                  </div>
                </div>
                {engagement.mostUsedFeatures.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.75rem', fontWeight: 600 }}>Most Used Features</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                      {engagement.mostUsedFeatures.slice(0, 5).map((feature) => (
                        <div key={feature.feature} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm, backgroundColor: colors.gray[50], borderRadius: '4px' }}>
                          <span style={{ fontSize: '0.875rem', color: colors.gray[900] }}>{feature.feature}</span>
                          <span style={{ fontSize: '0.875rem', color: colors.gray[500], fontWeight: 600 }}>{feature.usageCount} users</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.gray[500] }}>
                No engagement data available yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Funnel Section */}
      <div style={sectionCardStyle}>
        <button onClick={() => toggleSection('funnel')} style={sectionHeaderStyle}>
          <span>Funnel Analysis</span>
          <span style={{ fontSize: '1.5rem', color: colors.gray[500] }}>
            {expandedSections.funnel ? '−' : '+'}
          </span>
        </button>
        {expandedSections.funnel && (
          <div style={{ padding: `0 ${spacing.lg} ${spacing.lg} ${spacing.lg}` }}>
            {funnel ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: spacing.md
              }}>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Visits</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.gray[900] }}>{funnel.visitCount}</div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Signups</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.gray[900] }}>{funnel.signupCount}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.gray[500], marginTop: '0.25rem' }}>
                    {funnel.visitToSignupRate.toFixed(1)}% conversion
                  </div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Activations</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.gray[900] }}>{funnel.activationCount}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.gray[500], marginTop: '0.25rem' }}>
                    {funnel.signupToActivationRate.toFixed(1)}% conversion
                  </div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Return Usage</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.gray[900] }}>{funnel.returnUsageCount}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.gray[500], marginTop: '0.25rem' }}>
                    {funnel.activationToReturnRate.toFixed(1)}% conversion
                  </div>
                </div>
                <div style={metricCardStyle}>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500], marginBottom: '0.5rem' }}>Overall Conversion</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.gray[900] }}>{funnel.overallConversionRate.toFixed(1)}%</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.gray[500] }}>
                No funnel data available yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
