/**
 * Meal Planner Page
 * Day-by-day meal planning session with checkboxes for meal types
 */

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { mealPlanningService, mealProfileService, musgravesService, shoppingListService, shoppingListsService } from '../services';
import type { MealSuggestion, MealType, ShoppingListItem, ShoppingList } from '../types';
import Banner from '../components/layout/Banner';
import HamburgerMenu from '../components/layout/HamburgerMenu';
import Button from '../components/ui/Button';
import { addDays, format } from 'date-fns';

interface DayPlan {
  date: Date;
  breakfast?: MealSuggestion;
  lunch?: MealSuggestion;
  dinner?: MealSuggestion;
  servingSize?: number; // Number of people for this day (overrides profile default)
  dietApproach?: string; // Diet approach for this day (overrides profile default)
  dietStrict?: boolean; // Strict adherence for this day (overrides profile default)
  skipped: boolean;
  selectedMealTypes: Set<MealType>; // Which meal types are checked for suggestions
  suggestions: Map<MealType, MealSuggestion[]>; // Suggestions grouped by meal type
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' }
];

const MealPlanner: React.FC = () => {
  const [user] = useAuthState(auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Planning session state
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningMode, setPlanningMode] = useState<'today' | 'week' | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  
  // Shopping list state
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [generatedShoppingList, setGeneratedShoppingList] = useState<ShoppingList | null>(null);
  const [shoppingListItems, setShoppingListItems] = useState<ShoppingListItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [userShoppingLists, setUserShoppingLists] = useState<ShoppingList[]>([]);
  const [targetListId, setTargetListId] = useState<string | null>(null);
  const [addingItems, setAddingItems] = useState(false);

  // Initialize day plans with profile defaults
  useEffect(() => {
    const initializeDayPlans = async () => {
      if (!isPlanning || dayPlans.length > 0 || !user || !planningMode) return;

      try {
        // Load user's meal profile to get defaults
        const profile = await mealProfileService.getMealProfile(user.uid);
        
        const plans: DayPlan[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day
        
        // Determine number of days based on planning mode
        const numDays = planningMode === 'today' ? 1 : 7;
        
        for (let i = 0; i < numDays; i++) {
          plans.push({
            date: addDays(today, i),
            skipped: false,
            selectedMealTypes: new Set(),
            suggestions: new Map(),
            dietApproach: profile?.dietApproach,
            dietStrict: profile?.dietStrict
          });
        }
        setDayPlans(plans);
      } catch (error) {
        console.error('Error loading meal profile for day plans:', error);
        // Initialize without profile defaults if there's an error
        const plans: DayPlan[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day
        
        // Determine number of days based on planning mode
        const numDays = planningMode === 'today' ? 1 : 7;
        
        for (let i = 0; i < numDays; i++) {
          plans.push({
            date: addDays(today, i),
            skipped: false,
            selectedMealTypes: new Set(),
            suggestions: new Map()
          });
        }
        setDayPlans(plans);
      }
    };

    initializeDayPlans();
  }, [isPlanning, planningMode, dayPlans.length, user]);

  const handleStartPlanning = (mode: 'today' | 'week') => {
    setPlanningMode(mode);
    setIsPlanning(true);
    setCurrentDayIndex(0);
  };

  const handleToggleMealType = (mealType: MealType) => {
    const newDayPlans = [...dayPlans];
    const currentDay = newDayPlans[currentDayIndex];
    const newSelected = new Set(currentDay.selectedMealTypes);
    
    if (newSelected.has(mealType)) {
      newSelected.delete(mealType);
      // Clear suggestions for this meal type
      const newSuggestions = new Map(currentDay.suggestions);
      newSuggestions.delete(mealType);
      currentDay.suggestions = newSuggestions;
    } else {
      newSelected.add(mealType);
    }
    
    currentDay.selectedMealTypes = newSelected;
    setDayPlans(newDayPlans);
  };

  const handleGenerateSuggestions = async () => {
    if (!user || dayPlans.length === 0) return;
    
    const currentDay = dayPlans[currentDayIndex];
    const selectedTypes = Array.from(currentDay.selectedMealTypes);
    
    if (selectedTypes.length === 0) {
      alert('Please select at least one meal type (Breakfast, Lunch, or Dinner) to generate suggestions.');
      return;
    }

    setGenerating(true);
    try {
      const newDayPlans = [...dayPlans];
      const currentDayCopy = { ...newDayPlans[currentDayIndex] };
      const existingSuggestions = new Map(currentDayCopy.suggestions);
      
      // Generate suggestions for each selected meal type and append to existing
      for (const mealType of selectedTypes) {
        try {
          const newSuggestions = await mealPlanningService.generateDailySuggestions(
            user.uid,
            currentDay.date,
            mealType,
            currentDay.servingSize,
            currentDay.dietApproach,
            currentDay.dietStrict
          );
          
          // Append to existing suggestions for this meal type
          const currentSuggestions = existingSuggestions.get(mealType) || [];
          existingSuggestions.set(mealType, [...currentSuggestions, ...newSuggestions]);
        } catch (error) {
          console.error(`Error generating suggestions for ${mealType}:`, error);
          // Continue with other meal types even if one fails
        }
      }
      
      // Update day plan with accumulated suggestions
      currentDayCopy.suggestions = existingSuggestions;
      newDayPlans[currentDayIndex] = currentDayCopy;
      setDayPlans(newDayPlans);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate meal suggestions. Please make sure you have set up your meal profile and have an OpenAI API key configured.';
      alert(`Failed to generate meal suggestions.\n\n${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMoreSuggestions = async (mealType: MealType) => {
    if (!user || dayPlans.length === 0) return;
    
    const currentDay = dayPlans[currentDayIndex];
    
    setGenerating(true);
    try {
      const newSuggestions = await mealPlanningService.generateDailySuggestions(
        user.uid,
        currentDay.date,
        mealType,
        currentDay.servingSize,
        currentDay.dietApproach,
        currentDay.dietStrict
      );
      
      // Append to existing suggestions for this meal type
      const newDayPlans = [...dayPlans];
      const currentDayCopy = { ...newDayPlans[currentDayIndex] };
      const existingSuggestions = new Map(currentDayCopy.suggestions);
      const currentSuggestions = existingSuggestions.get(mealType) || [];
      existingSuggestions.set(mealType, [...currentSuggestions, ...newSuggestions]);
      
      currentDayCopy.suggestions = existingSuggestions;
      newDayPlans[currentDayIndex] = currentDayCopy;
      setDayPlans(newDayPlans);
    } catch (error) {
      console.error(`Error generating more suggestions for ${mealType}:`, error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate more meal suggestions. Please make sure you have set up your meal profile and have an OpenAI API key configured.';
      alert(`Failed to generate more meal suggestions.\n\n${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectMeal = (mealType: MealType, suggestion: MealSuggestion) => {
    const newDayPlans = [...dayPlans];
    const currentDay = newDayPlans[currentDayIndex];
    
    currentDay[mealType] = suggestion;
    currentDay.skipped = false;
    
    setDayPlans(newDayPlans);
  };

  const handleChangeMeal = (mealType: MealType) => {
    const newDayPlans = [...dayPlans];
    delete newDayPlans[currentDayIndex][mealType];
    setDayPlans(newDayPlans);
  };

  const handleSkipDay = () => {
    const newDayPlans = [...dayPlans];
    newDayPlans[currentDayIndex].skipped = true;
    setDayPlans(newDayPlans);
    
    // Move to next day
    if (currentDayIndex < 6) {
      setCurrentDayIndex(currentDayIndex + 1);
    } else {
      // All days done, finish planning
      handleFinishPlanning();
    }
  };

  const handleNextDay = () => {
    if (currentDayIndex < 6) {
      setCurrentDayIndex(currentDayIndex + 1);
    } else {
      // All days done, finish planning
      handleFinishPlanning();
    }
  };

  const handleFinishPlanning = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Convert day plans to meal suggestions
      const selectedSuggestions: MealSuggestion[] = [];
      
      dayPlans.forEach(dayPlan => {
        if (!dayPlan.skipped) {
          if (dayPlan.breakfast) selectedSuggestions.push(dayPlan.breakfast!);
          if (dayPlan.lunch) selectedSuggestions.push(dayPlan.lunch!);
          if (dayPlan.dinner) selectedSuggestions.push(dayPlan.dinner!);
        }
      });

      if (selectedSuggestions.length === 0) {
        alert('No meals selected. Please select at least one meal or skip days.');
        setLoading(false);
        return;
      }

      // Create meal plan - use the first day's date as the start date
      const startDate = dayPlans.length > 0 ? dayPlans[0].date : new Date();
      const mealPlan = await mealPlanningService.createMealPlan(user.uid, startDate, selectedSuggestions);
      
      // Generate shopping list
      const shoppingList = await musgravesService.createShoppingListFromMealPlan(mealPlan);
      
      // Fetch shopping list items
      const items = await shoppingListService.getShoppingListItems(user.uid, shoppingList.id);
      
      // Fetch user's shopping lists for target selection
      const userLists = await shoppingListsService.getShoppingLists(user.uid);
      
      // Set default target list (default list or first list)
      const defaultList = userLists.find(list => list.isDefault) || userLists[0];
      
      // Update state to show shopping list UI
      setGeneratedShoppingList(shoppingList);
      setShoppingListItems(items);
      setUserShoppingLists(userLists);
      setTargetListId(defaultList?.id || null);
      setShowShoppingList(true);
      
      // Reset planning session but keep shopping list visible
      setIsPlanning(false);
      setCurrentDayIndex(0);
    } catch (error) {
      console.error('Error finishing planning:', error);
      alert('Failed to create meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDay = () => {
    if (dayPlans.length === 0) return null;
    return dayPlans[currentDayIndex];
  };

  const getProgress = () => {
    let planned = 0;
    let total = 0;
    
    dayPlans.forEach(day => {
      if (day.skipped) {
        planned++;
        total++;
      } else {
        total++;
        // Day is considered planned if at least one meal is selected
        if (day.breakfast || day.lunch || day.dinner) {
          planned++;
        }
      }
    });
    
    return { planned, total };
  };

  const isDayComplete = (day: DayPlan) => {
    if (day.skipped) return true;
    const selectedTypes = Array.from(day.selectedMealTypes);
    if (selectedTypes.length === 0) return false;
    
    // Check if all selected meal types have a meal chosen
    return selectedTypes.every(mealType => day[mealType] !== undefined);
  };

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedItems(new Set(shoppingListItems.map(item => item.id)));
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleAddToShopList = async () => {
    if (!user || !targetListId || selectedItems.size === 0) {
      alert('Please select items and a target list.');
      return;
    }

    setAddingItems(true);
    try {
      const selectedItemNames = shoppingListItems
        .filter(item => selectedItems.has(item.id))
        .map(item => item.name);

      // Add each selected item to the target list
      for (const itemName of selectedItemNames) {
        await shoppingListService.addShoppingListItem(user.uid, targetListId, itemName);
      }

      alert(`Successfully added ${selectedItemNames.length} item(s) to your shop list!`);
      
      // Reset shopping list UI
      setShowShoppingList(false);
      setGeneratedShoppingList(null);
      setShoppingListItems([]);
      setSelectedItems(new Set());
      setDayPlans([]);
    } catch (error) {
      console.error('Error adding items to shop list:', error);
      alert('Failed to add items to shop list. Please try again.');
    } finally {
      setAddingItems(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please log in to access meal planner.</p>
      </div>
    );
  }

  const currentDay = getCurrentDay();
  const progress = getProgress();
  const dayComplete = currentDay ? isDayComplete(currentDay) : false;

  return (
    <>
      <Banner showHomeIcon={true} onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Meal Planner</h2>
        
        {showShoppingList && generatedShoppingList ? (
          <div>
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f0f8ff', border: '2px solid #002B4D', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Suggested Shopping List</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: '#666' }}>
                Review the items below and select which ones you'd like to add to your shop list.
              </p>
              
              {/* Select target list */}
              {userShoppingLists.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    Add to shop list:
                  </label>
                  <select
                    value={targetListId || ''}
                    onChange={(e) => setTargetListId(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      color: '#1f2937',
                      cursor: 'pointer'
                    }}
                  >
                    {userShoppingLists.map(list => (
                      <option key={list.id} value={list.id}>
                        {list.name} {list.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Select All / Deselect All */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </Button>
                <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#666', alignSelf: 'center' }}>
                  {selectedItems.size} of {shoppingListItems.length} items selected
                </span>
              </div>

              {/* Shopping list items */}
              {shoppingListItems.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No items in shopping list.</p>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  {shoppingListItems.map(item => (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        backgroundColor: selectedItems.has(item.id) ? '#f0f8ff' : '#ffffff',
                        border: `1px solid ${selectedItems.has(item.id) ? '#002B4D' : '#e5e7eb'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleToggleItem(item.id)}
                        style={{
                          width: '1.25rem',
                          height: '1.25rem',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontSize: '1rem', flex: 1 }}>{item.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button
                  onClick={handleAddToShopList}
                  disabled={selectedItems.size === 0 || !targetListId || addingItems}
                  loading={addingItems}
                  fullWidth
                >
                  {addingItems ? 'Adding Items...' : `Add ${selectedItems.size} Item(s) to Shop List`}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowShoppingList(false);
                    setGeneratedShoppingList(null);
                    setShoppingListItems([]);
                    setSelectedItems(new Set());
                    setDayPlans([]);
                  }}
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        ) : !isPlanning ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ marginBottom: '2rem', color: '#666' }}>
              Choose how many days you'd like to plan meals for.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                onClick={() => handleStartPlanning('today')}
                size="large"
                style={{ minWidth: '200px' }}
              >
                Plan Today
              </Button>
              <Button
                onClick={() => handleStartPlanning('week')}
                size="large"
                style={{ minWidth: '200px' }}
              >
                Plan for the Next 7 Days
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Progress indicator */}
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600' }}>Progress: {progress.planned} of {progress.total} days</span>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  Day {currentDayIndex + 1} of {dayPlans.length}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${(progress.planned / progress.total) * 100}%`, 
                    height: '100%', 
                    backgroundColor: '#002B4D',
                    transition: 'width 0.3s'
                  }} 
                />
              </div>
            </div>

            {currentDay && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0 }}>
                      {format(currentDay.date, 'EEEE, MMMM d')}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.875rem', color: '#666' }} htmlFor={`serving-size-${currentDayIndex}`}>
                        Serving size:
                      </label>
                      <input
                        id={`serving-size-${currentDayIndex}`}
                        type="number"
                        min="1"
                        value={currentDay.servingSize || ''}
                        onChange={(e) => {
                          const newPlans = [...dayPlans];
                          const value = e.target.value;
                          newPlans[currentDayIndex].servingSize = value ? parseInt(value, 10) : undefined;
                          setDayPlans(newPlans);
                        }}
                        placeholder="Default"
                        style={{
                          width: '80px',
                          padding: '0.5rem 0.75rem',
                          fontSize: '1rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          color: '#1f2937'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#002B4D';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                        }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>people</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.875rem', color: '#666' }} htmlFor={`diet-approach-${currentDayIndex}`}>
                        Diet approach:
                      </label>
                      <select
                        id={`diet-approach-${currentDayIndex}`}
                        value={currentDay.dietApproach || ''}
                        onChange={(e) => {
                          const newPlans = [...dayPlans];
                          newPlans[currentDayIndex].dietApproach = e.target.value || undefined;
                          if (!e.target.value) {
                            newPlans[currentDayIndex].dietStrict = undefined;
                          }
                          setDayPlans(newPlans);
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '1rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          color: '#1f2937',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#002B4D';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                        }}
                      >
                        <option value="">None</option>
                        <option value="Paleo">Paleo</option>
                        <option value="Weight Watchers">Weight Watchers</option>
                        <option value="Mediterranean">Mediterranean</option>
                        <option value="Keto">Keto</option>
                        <option value="Whole30">Whole30</option>
                        <option value="DASH">DASH</option>
                        <option value="Flexitarian">Flexitarian</option>
                        <option value="Low-Carb">Low-Carb</option>
                        <option value="Plant-Based">Plant-Based</option>
                        <option value="Vegan">Vegan</option>
                      </select>
                    </div>
                    {currentDay.dietApproach && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          id={`diet-strict-${currentDayIndex}`}
                          checked={currentDay.dietStrict || false}
                          onChange={(e) => {
                            const newPlans = [...dayPlans];
                            newPlans[currentDayIndex].dietStrict = e.target.checked;
                            setDayPlans(newPlans);
                          }}
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            cursor: 'pointer'
                          }}
                        />
                        <label htmlFor={`diet-strict-${currentDayIndex}`} style={{ fontSize: '0.875rem', color: '#666', cursor: 'pointer' }}>
                          Strict
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                
                {currentDay.skipped ? (
                  <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ color: '#666', marginBottom: '1rem' }}>This day has been skipped.</p>
                    <Button onClick={() => {
                      const newPlans = [...dayPlans];
                      newPlans[currentDayIndex].skipped = false;
                      setDayPlans(newPlans);
                    }}>
                      Plan This Day
                    </Button>
                  </div>
                ) : (
                  <div>
                    {/* Meal type checkboxes */}
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Select meals to plan:</h4>
                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        {MEAL_TYPES.map(mealType => (
                          <label
                            key={mealType.value}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={currentDay.selectedMealTypes.has(mealType.value)}
                              onChange={() => handleToggleMealType(mealType.value)}
                              style={{
                                width: '1.25rem',
                                height: '1.25rem',
                                cursor: 'pointer'
                              }}
                            />
                            <span style={{ fontSize: '1rem', fontWeight: '500' }}>{mealType.label}</span>
                          </label>
                        ))}
                      </div>
                      
                      {currentDay.selectedMealTypes.size > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <Button
                            onClick={handleGenerateSuggestions}
                            disabled={generating}
                            loading={generating}
                            fullWidth
                          >
                            {generating ? 'Generating Suggestions...' : `Generate Suggestions for ${Array.from(currentDay.selectedMealTypes).map(mt => MEAL_TYPES.find(m => m.value === mt)?.label).join(', ')}`}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Display suggestions and selected meals */}
                    {Array.from(currentDay.selectedMealTypes).map(mealType => {
                      const mealTypeLabel = MEAL_TYPES.find(m => m.value === mealType)?.label || mealType;
                      const selectedMeal = currentDay[mealType];
                      const suggestions = currentDay.suggestions.get(mealType) || [];
                      
                      return (
                        <div key={mealType} style={{ marginBottom: '2rem' }}>
                          <h4 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>{mealTypeLabel}</h4>
                          
                          {selectedMeal ? (
                            <div style={{ padding: '1rem', backgroundColor: '#f0f8ff', border: '2px solid #002B4D', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <strong>{selectedMeal.mealName}</strong>
                                  {selectedMeal.reasoning && (
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
                                      {selectedMeal.reasoning}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="text"
                                  size="small"
                                  onClick={() => handleChangeMeal(mealType)}
                                >
                                  Change
                                </Button>
                              </div>
                            </div>
                          ) : suggestions.length > 0 ? (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                                  Select one of the {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}:
                                </p>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                {suggestions.map((suggestion, index) => (
                                  <div
                                    key={index}
                                    onClick={() => handleSelectMeal(mealType, suggestion)}
                                    style={{
                                      border: '2px solid #002B4D',
                                      borderRadius: '8px',
                                      padding: '1rem',
                                      cursor: 'pointer',
                                      backgroundColor: '#fff',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f0f8ff';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#fff';
                                    }}
                                  >
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{suggestion.mealName}</h4>
                                    {suggestion.reasoning && (
                                      <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', fontStyle: 'italic', color: '#666' }}>
                                        {suggestion.reasoning}
                                      </p>
                                    )}
                                    {suggestion.usesExpiringItems.length > 0 && (
                                      <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#d97706' }}>
                                        Uses {suggestion.usesExpiringItems.length} expiring item(s)
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Button
                                  onClick={() => handleGenerateMoreSuggestions(mealType)}
                                  disabled={generating}
                                  loading={generating}
                                  variant="secondary"
                                  size="small"
                                >
                                  Generate 3 More Suggestions
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                      <Button
                        variant="secondary"
                        onClick={handleSkipDay}
                      >
                        Skip This Day
                      </Button>
                      {dayComplete && (
                        <Button
                          onClick={handleNextDay}
                        >
                          {currentDayIndex < 6 ? 'Next Day' : 'Finish Planning'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Finish button - show when all days are done */}
            {progress.planned === progress.total && (
              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem' }}>All days planned! Ready to generate your shopping list.</p>
                <Button
                  onClick={handleFinishPlanning}
                  disabled={loading}
                  loading={loading}
                  size="large"
                >
                  Finish Planning & Generate Shopping List
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MealPlanner;
