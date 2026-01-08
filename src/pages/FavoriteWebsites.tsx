/**
 * Favorite Websites Page
 * Manage favorite and suggested recipe websites
 */

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { recipeSiteService } from '../services';
import type { RecipeSite } from '../types/recipeImport';
import HamburgerMenu from '../components/layout/HamburgerMenu';
import Banner from '../components/layout/Banner';
import { showToast } from '../components/Toast';

const FavoriteWebsites: React.FC = () => {
  const [user] = useAuthState(auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [recipeSites, setRecipeSites] = useState<RecipeSite[]>([]);
  const [favoriteSites, setFavoriteSites] = useState<RecipeSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'suggested'>('favorites');

  // Load recipe sites
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadSites = async () => {
      try {
        setLoading(true);
        const allSites = await recipeSiteService.getRecipeSites();
        setRecipeSites(allSites);
        
        // For now, treat enabled sites as favorites (can be enhanced later with user preferences)
        const enabled = allSites.filter(site => site.enabled);
        setFavoriteSites(enabled);
      } catch (error) {
        console.error('Error loading recipe sites:', error);
        showToast('Failed to load recipe sites', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadSites();
  }, [user]);

  const handleToggleFavorite = async (site: RecipeSite) => {
    if (!user) return;

    try {
      // Toggle enabled status (for now, this acts as favorite)
      await recipeSiteService.updateRecipeSite(site.id, {
        enabled: !site.enabled
      });
      
      // Reload sites
      const allSites = await recipeSiteService.getRecipeSites();
      setRecipeSites(allSites);
      const enabled = allSites.filter(s => s.enabled);
      setFavoriteSites(enabled);
      
      showToast(site.enabled ? 'Removed from favorites' : 'Added to favorites', 'success');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorite', 'error');
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please log in to manage favorite websites.</p>
      </div>
    );
  }

  const displayedSites = activeTab === 'favorites' ? favoriteSites : recipeSites;

  return (
    <>
      <Banner showHomeIcon={true} onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Favorite Recipe Websites</h2>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('favorites')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'favorites' ? '#002B4D' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'favorites' ? '2px solid #002B4D' : '2px solid transparent',
              fontSize: '1rem',
              fontWeight: activeTab === 'favorites' ? '600' : '500',
              cursor: 'pointer'
            }}
          >
            Favorites ({favoriteSites.length})
          </button>
          <button
            onClick={() => setActiveTab('suggested')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'suggested' ? '#002B4D' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === 'suggested' ? '2px solid #002B4D' : '2px solid transparent',
              fontSize: '1rem',
              fontWeight: activeTab === 'suggested' ? '600' : '500',
              cursor: 'pointer'
            }}
          >
            Suggested ({recipeSites.length})
          </button>
        </div>

        {/* Website List */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading websites...</p>
        ) : displayedSites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <p>No {activeTab === 'favorites' ? 'favorite' : 'suggested'} websites available.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {displayedSites.map(site => (
              <div
                key={site.id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                    {site.label}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                    {site.baseUrl}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFavorite(site)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: site.enabled ? '#fee2e2' : '#d1fae5',
                    color: site.enabled ? '#991b1b' : '#065f46',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    minWidth: '120px'
                  }}
                >
                  {site.enabled ? '★ Favorited' : '☆ Add to Favorites'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
            <strong>Tip:</strong> Favorite websites will appear first when searching for recipes. You can toggle favorites by clicking the button next to each website.
          </p>
        </div>
      </div>
    </>
  );
};

export default FavoriteWebsites;
