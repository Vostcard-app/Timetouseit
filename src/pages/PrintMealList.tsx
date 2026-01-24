/**
 * Print Meal List Page
 * Printable view of planned meals for a day or week
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { mealPlanningService } from '../services';
import type { PlannedMeal, MealType } from '../types';
import Banner from '../components/layout/Banner';
import HamburgerMenu from '../components/layout/HamburgerMenu';
import { format, startOfWeek, addDays, isSameDay, parseISO, startOfDay } from 'date-fns';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'B',
  lunch: 'L',
  dinner: 'D'
};

const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

const PrintMealList: React.FC = () => {
  const [user] = useAuthState(auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        return startOfDay(parseISO(dateParam));
      } catch {
        return startOfDay(new Date());
      }
    }
    return startOfDay(new Date());
  });
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load meals for the month containing the selected date
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadMeals = async () => {
      try {
        setLoading(true);
        const allMeals = await mealPlanningService.loadAllPlannedMealsForMonth(user.uid, selectedDate);
        
        // Normalize meal dates to start of day for consistent comparison
        const normalizedMeals = allMeals.map(meal => ({
          ...meal,
          date: startOfDay(meal.date)
        }));
        
        console.log('Loaded meals:', normalizedMeals.length);
        console.log('Selected date:', selectedDate);
        console.log('Meal dates:', normalizedMeals.map(m => ({ date: m.date, mealType: m.mealType, dishes: m.dishes?.length || 0 })));
        
        setMeals(normalizedMeals);
      } catch (error) {
        console.error('Error loading meals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMeals();
  }, [user, selectedDate]);

  // Filter meals based on view mode
  const filteredMeals = useMemo(() => {
    if (viewMode === 'day') {
      const filtered = meals.filter(meal => isSameDay(meal.date, selectedDate));
      console.log('Day view - filtered meals:', filtered.length, 'for date:', selectedDate);
      return filtered;
    } else {
      // Week view: get week starting from selected date
      const weekStart = startOfDay(startOfWeek(selectedDate, { weekStartsOn: 0 }));
      const weekEnd = startOfDay(addDays(weekStart, 6));
      const filtered = meals.filter(meal => {
        const mealDate = startOfDay(meal.date);
        return mealDate >= weekStart && mealDate <= weekEnd;
      });
      console.log('Week view - filtered meals:', filtered.length, 'for week:', weekStart, 'to', weekEnd);
      return filtered;
    }
  }, [meals, selectedDate, viewMode]);

  // Toggle ingredients visibility
  const toggleIngredients = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Group meals for display
  const groupedMeals = useMemo(() => {
    if (viewMode === 'day') {
      // Day view: sort by meal type
      const grouped: Record<MealType, PlannedMeal[]> = {
        breakfast: [],
        lunch: [],
        dinner: []
      };
      
      filteredMeals.forEach(meal => {
        grouped[meal.mealType].push(meal);
      });
      
      return grouped;
    } else {
      // Week view: group by meal type first, then by day
      const grouped: Record<MealType, PlannedMeal[]> = {
        breakfast: [],
        lunch: [],
        dinner: []
      };
      
      filteredMeals.forEach(meal => {
        grouped[meal.mealType].push(meal);
      });
      
      // Sort each meal type by date
      MEAL_TYPE_ORDER.forEach(mealType => {
        grouped[mealType].sort((a, b) => a.date.getTime() - b.date.getTime());
      });
      
      return grouped;
    }
  }, [filteredMeals, viewMode]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = startOfDay(new Date(e.target.value));
    setSelectedDate(newDate);
    setSearchParams({ date: format(newDate, 'yyyy-MM-dd') });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDateNavigation = (direction: 'prev' | 'next') => {
    const daysToAdd = viewMode === 'day' ? (direction === 'next' ? 1 : -1) : (direction === 'next' ? 7 : -7);
    const newDate = addDays(selectedDate, daysToAdd);
    setSelectedDate(newDate);
    setSearchParams({ date: format(newDate, 'yyyy-MM-dd') });
  };

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please log in to view meal lists.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading meals...</p>
      </div>
    );
  }

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = addDays(weekStart, 6);

  return (
    <>
      <Banner showHomeIcon={true} showLogo={false} onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Controls - Hidden when printing */}
        <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={() => setViewMode('day')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: viewMode === 'day' ? '#002B4D' : '#f3f4f6',
                  color: viewMode === 'day' ? 'white' : '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: viewMode === 'day' ? '600' : '400'
                }}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: viewMode === 'week' ? '#002B4D' : '#f3f4f6',
                  color: viewMode === 'week' ? 'white' : '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: viewMode === 'week' ? '600' : '400'
                }}
              >
                Week
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={() => handleDateNavigation('prev')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ← {viewMode === 'day' ? 'Previous Day' : 'Previous Week'}
              </button>
              
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
              
              <button
                onClick={() => handleDateNavigation('next')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                {viewMode === 'day' ? 'Next Day' : 'Next Week'} →
              </button>
            </div>
            
            <button
              onClick={handlePrint}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#002B4D',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Print
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="printable-content">
          {/* Header */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                Meal List
              </h1>
              <button
                onClick={() => navigate('/planned-meal-calendar')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#002B4D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Calendar
              </button>
            </div>
            {viewMode === 'day' ? (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.25rem', color: '#6b7280' }}>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            ) : (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.25rem', color: '#6b7280' }}>
                {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Meals List */}
          {MEAL_TYPE_ORDER.map(mealType => {
            const mealsForType = groupedMeals[mealType];
            if (mealsForType.length === 0) return null;

            return (
              <div key={mealType} style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                <h2 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  borderBottom: '2px solid #002B4D',
                  paddingBottom: '0.5rem'
                }}>
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </h2>
                
                {mealsForType.map(meal => (
                  <div key={meal.id} style={{ marginBottom: '1.5rem', marginLeft: '1rem' }}>
                    {/* Meal Date (for week view) */}
                    {viewMode === 'week' && (
                      <p style={{ 
                        margin: '0 0 0.5rem 0', 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        color: '#6b7280' 
                      }}>
                        {format(meal.date, 'EEEE, MMMM d')}
                      </p>
                    )}
                    
                    {/* Dishes */}
                    {meal.dishes && meal.dishes.length > 0 ? (
                      meal.dishes.map(dish => {
                        const itemId = `${meal.id}-${dish.id}`;
                        const isExpanded = expandedItems.has(itemId);
                        const hasIngredients = dish.recipeIngredients && dish.recipeIngredients.length > 0;
                        
                        return (
                          <div key={dish.id} style={{ marginBottom: '1rem', marginLeft: '1rem' }}>
                            <div
                              onClick={() => hasIngredients && toggleIngredients(itemId)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: hasIngredients ? 'pointer' : 'default',
                                padding: '0.25rem 0',
                                transition: 'background-color 0.2s',
                                borderRadius: '4px'
                              }}
                              onMouseEnter={(e) => {
                                if (hasIngredients) {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (hasIngredients) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              {hasIngredients && (
                                <span style={{
                                  fontSize: '0.875rem',
                                  color: '#6b7280',
                                  transition: 'transform 0.2s',
                                  display: 'inline-block',
                                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                }}>
                                  ▶
                                </span>
                              )}
                              <p style={{ 
                                margin: 0,
                                fontSize: '1.125rem', 
                                fontWeight: '600', 
                                color: '#1f2937',
                                flex: 1
                              }}>
                                {MEAL_TYPE_LABELS[mealType]} {dish.dishName}
                              </p>
                            </div>
                            {isExpanded && hasIngredients && (
                              <ul style={{ 
                                marginTop: '0.5rem', 
                                marginLeft: '1.5rem',
                                paddingLeft: '1rem',
                                listStyle: 'disc',
                                fontSize: '0.875rem',
                                color: '#6b7280'
                              }}>
                                {dish.recipeIngredients.map((ingredient, idx) => (
                                  <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                    {ingredient}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#9ca3af', fontStyle: 'italic' }}>
                        No dishes planned
                      </p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Empty State */}
          {filteredMeals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
              <p style={{ fontSize: '1.25rem', margin: 0 }}>
                No meals planned for {viewMode === 'day' ? 'this day' : 'this week'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 1in;
          }
          
          .no-print {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
          
          .printable-content {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          h1, h2, p {
            color: #000 !important;
          }
          
          /* Prevent page breaks inside meal sections */
          div[style*="pageBreakInside"] {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
};

export default PrintMealList;
