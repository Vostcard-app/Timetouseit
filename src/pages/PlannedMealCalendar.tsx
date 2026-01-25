/**
 * Planned Meal Calendar Page
 * Displays calendar with planned meals and allows day taps to open ingredient picker
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { mealPlanningService, userSettingsService } from '../services';
import type { MealPlan, PlannedMeal, MealType, Dish, FavoriteRecipe } from '../types';
import HamburgerMenu from '../components/layout/HamburgerMenu';
import Banner from '../components/layout/Banner';
import { IngredientPickerModal } from '../components/MealPlanner/IngredientPickerModal';
import { MealDetailModal } from '../components/MealPlanner/MealDetailModal';
import { MealTypeSelectionModal } from '../components/MealPlanner/MealTypeSelectionModal';
import { DayMealsModal } from '../components/MealPlanner/DayMealsModal';
import { DishListModal } from '../components/MealPlanner/DishListModal';
import { MealSelectionModal } from '../components/MealPlanner/MealSelectionModal';
import { CalendarNavigation } from '../components/MealPlanner/CalendarNavigation';
import { CalendarGrid } from '../components/MealPlanner/CalendarGrid';
import { addDays, startOfWeek, isSameDay, startOfDay } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { showToast } from '../components/Toast';
import type { PlannedMealCalendarLocationState } from '../types/navigation';
import 'react-big-calendar/lib/css/react-big-calendar.css';


const PlannedMealCalendar: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showMealTypeSelection, setShowMealTypeSelection] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [showDishList, setShowDishList] = useState(false);
  const [showDayMealsModal, setShowDayMealsModal] = useState(false);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [selectedDish, setSelectedDish] = useState<{ dish: Dish; meal: PlannedMeal } | null>(null);
  const [showMealDetailModal, setShowMealDetailModal] = useState(false);
  const [showMealSelectionModal, setShowMealSelectionModal] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [favoriteRecipe, setFavoriteRecipe] = useState<FavoriteRecipe | null>(null);
  const unsubscribeRef = useRef<Map<string, () => void>>(new Map());
  const loadedWeeksRef = useRef<Set<string>>(new Set());
  const cleanupDoneRef = useRef<boolean>(false);
  
  // Drag and drop state
  const [draggedMeal, setDraggedMeal] = useState<{ meal: PlannedMeal; sourceDate: Date } | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [dragOverMealType, setDragOverMealType] = useState<MealType | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Check for favorite recipe or recipe URL in location state
  useEffect(() => {
    const locationState = location.state as PlannedMealCalendarLocationState | null;
    if (locationState?.favoriteRecipe) {
      setFavoriteRecipe(locationState.favoriteRecipe);
      // Don't auto-select date - wait for user to click on calendar
      // If a date is provided in state, navigate to that month but don't auto-select
      if (locationState.selectedDate) {
        setCurrentDate(locationState.selectedDate);
      }
      // Don't auto-open modals - wait for user to select date on calendar
    } else if (locationState?.recipeUrl) {
      // Store recipe URL as a favorite recipe object to pass to IngredientPickerModal
      // It will auto-import when modal opens
      setFavoriteRecipe({
        id: '',
        userId: user?.uid || '',
        dishName: '',
        recipeSourceUrl: locationState.recipeUrl,
        recipeIngredients: [],
        createdAt: new Date()
      } as FavoriteRecipe);
      if (locationState.selectedDate) {
        setCurrentDate(locationState.selectedDate);
      }
    }
  }, [location.state, user]);


  // Check premium status
  useEffect(() => {
    const checkPremium = async () => {
      if (!user) {
        setIsPremium(false);
        return;
      }
      try {
        const premium = await userSettingsService.isPremiumUser(user.uid);
        setIsPremium(premium);
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
      }
    };
    checkPremium();
  }, [user]);

  // Subscribe to meal plans for current month (real-time updates)
  useEffect(() => {
    // Wait for premium status to be determined
    if (isPremium === null) {
      return;
    }

    if (!user || !isPremium) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Reset loaded weeks tracking for new month
    loadedWeeksRef.current.clear();
    
    // Calculate month boundaries based on currentDate (the month being viewed)
    const viewDate = startOfDay(currentDate);
    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    
    // Get all week starts in the month
    const weekStarts: Date[] = [];
    let weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    while (weekStart <= monthEnd) {
      weekStarts.push(new Date(weekStart));
      weekStart = addDays(weekStart, 7);
    }

    // Set up subscriptions for each week
    const unsubscribes = new Map<string, () => void>();
    const totalWeeks = weekStarts.length;

    // If no weeks to load, set loading to false immediately
    if (totalWeeks === 0) {
      setLoading(false);
      return;
    }

    // Safety timeout to ensure loading doesn't stay true forever
    const loadingTimeout = setTimeout(() => {
      console.warn('Meal plan loading timeout - setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    weekStarts.forEach(weekStartDate => {
      const weekKey = weekStartDate.getTime().toString();
      
      const unsubscribe = mealPlanningService.subscribeToMealPlan(
        user.uid,
        weekStartDate,
        (plan: MealPlan | null) => {
          setMealPlans(prevPlans => {
            // Remove old plan for this week if it exists
            const filtered = prevPlans.filter(p => {
              const planWeekStart = startOfWeek(p.weekStartDate, { weekStartsOn: 0 });
              return planWeekStart.getTime() !== weekStartDate.getTime();
            });
            
            // Add new plan if it exists
            if (plan) {
              return [...filtered, plan];
            }
            
            return filtered;
          });
          
          // Track initial load for this week (only count once per week)
          if (!loadedWeeksRef.current.has(weekKey)) {
            loadedWeeksRef.current.add(weekKey);
            if (loadedWeeksRef.current.size === totalWeeks) {
              clearTimeout(loadingTimeout);
              setLoading(false);
            }
          }
        }
      );
      
      unsubscribes.set(weekKey, unsubscribe);
    });

    // Store unsubscribe functions
    unsubscribeRef.current = unsubscribes;

    // Cleanup function
    return () => {
      clearTimeout(loadingTimeout);
      unsubscribes.forEach(unsubscribe => unsubscribe());
      unsubscribes.clear();
      loadedWeeksRef.current.clear();
    };
  }, [user, currentDate, isPremium]);

  // Refresh meal plans (kept as fallback, but subscriptions handle updates automatically)
  const refreshMealPlans = async () => {
    // Subscriptions handle real-time updates, but we can keep this as a fallback
    // if needed for manual refresh scenarios
    if (!user) return;
    
    // Force re-subscription by updating currentDate slightly
    // This will trigger the useEffect to re-subscribe
    setCurrentDate(new Date());
  };

  // Migrate legacy meal to new dishes structure
  const migrateLegacyMeal = (meal: PlannedMeal): PlannedMeal => {
    // If meal already has dishes, return as-is
    if (meal.dishes && meal.dishes.length > 0) {
      return {
        ...meal,
        date: startOfDay(meal.date)
      };
    }

    // Check if this is a legacy meal (has old structure)
    const hasLegacyData = meal.mealName || meal.recipeTitle || (meal.recipeIngredients && meal.recipeIngredients.length > 0) || (meal.suggestedIngredients && meal.suggestedIngredients.length > 0);

    if (hasLegacyData) {
      // Create a dish from legacy meal data
      const dish: Dish = {
        id: meal.id + '-dish-0', // Generate a unique ID for the migrated dish
        dishName: meal.mealName || meal.recipeTitle || 'Unnamed Dish',
        recipeTitle: meal.recipeTitle || null,
        recipeIngredients: meal.recipeIngredients || meal.suggestedIngredients || [],
        recipeSourceUrl: meal.recipeSourceUrl || null,
        recipeSourceDomain: meal.recipeSourceDomain || null,
        recipeImageUrl: meal.recipeImageUrl || null,
        reservedQuantities: meal.reservedQuantities || {},
        claimedItemIds: meal.claimedItemIds || meal.usesBestBySoonItems || [],
        claimedShoppingListItemIds: meal.claimedShoppingListItemIds || [],
        completed: meal.completed || false
      };

      return {
        ...meal,
        date: startOfDay(meal.date),
        dishes: [dish]
      };
    }

    // No legacy data, just ensure dishes array exists
    return {
      ...meal,
      date: startOfDay(meal.date),
      dishes: []
    };
  };

  // Get all planned meals from all meal plans
  const allPlannedMeals = useMemo(() => {
    const meals: PlannedMeal[] = [];
    mealPlans.forEach(plan => {
      plan.meals.forEach(meal => {
        // Migrate legacy meals and normalize dates
        meals.push(migrateLegacyMeal(meal));
      });
    });
    return meals;
  }, [mealPlans]);

  // Create meals by day map for CalendarGrid (kept for potential future use)
  // const mealsByDayMap = useMemo(() => {
  //   const map = new Map<string, PlannedMeal[]>();
  //   allPlannedMeals.forEach(meal => {
  //     const dayKey = startOfDay(meal.date).toISOString().split('T')[0];
  //     if (!map.has(dayKey)) {
  //       map.set(dayKey, []);
  //     }
  //     const dayMeals = map.get(dayKey)!;
  //     // Only include meals with dishes
  //     if (meal.dishes && meal.dishes.length > 0) {
  //       dayMeals.push(meal);
  //     }
  //   });
  //   return map;
  // }, [allPlannedMeals]);

  // Get meals for a specific day
  const getMealsForDay = (date: Date): PlannedMeal[] => {
    const normalizedDate = startOfDay(date);
    return allPlannedMeals.filter(meal => {
      // Only include meals for this date that have at least one dish
      const isSameDate = isSameDay(meal.date, normalizedDate);
      const hasDishes = meal.dishes && meal.dishes.length > 0;
      return isSameDate && hasDishes;
    });
  };

  // Get meal for a specific day and meal type
  const getMealForDayAndType = (date: Date, mealType: MealType): PlannedMeal | null => {
    const normalizedDate = startOfDay(date);
    const meal = allPlannedMeals.find(meal => isSameDay(meal.date, normalizedDate) && meal.mealType === mealType);
    
    if (!meal) {
      console.log('Meal not found for:', { date: normalizedDate, mealType, allMeals: allPlannedMeals.map(m => ({ date: m.date, mealType: m.mealType, dishes: m.dishes?.length || 0 })) });
      return null;
    }
    
    // Meal is already migrated in allPlannedMeals, just return it
    return meal;
  };

  // One-time cleanup: Remove legacy dinner meals from January 12th and 14th, 2026
  useEffect(() => {
    if (!user || cleanupDoneRef.current) return;
    if (allPlannedMeals.length === 0) return; // Wait for meals to be computed

    const cleanupLegacyMeals = async () => {
      try {
        // January 12th, 2026
        const jan12 = startOfDay(new Date(2026, 0, 12)); // Month is 0-indexed
        
        // January 14th, 2026
        const jan14 = startOfDay(new Date(2026, 0, 14));

        // Find meals for these dates (inline logic to avoid dependency issues)
        const jan12Meal = allPlannedMeals.find(meal => 
          isSameDay(meal.date, jan12) && meal.mealType === 'dinner'
        );
        const jan14Meal = allPlannedMeals.find(meal => 
          isSameDay(meal.date, jan14) && meal.mealType === 'dinner'
        );

        if (jan12Meal) {
          console.log('[cleanupLegacyMeals] Deleting legacy dinner from January 12th');
          await mealPlanningService.deleteMeal(user.uid, jan12Meal.id);
        }

        if (jan14Meal) {
          console.log('[cleanupLegacyMeals] Deleting legacy dinner from January 14th');
          await mealPlanningService.deleteMeal(user.uid, jan14Meal.id);
        }

        cleanupDoneRef.current = true; // Mark as done
      } catch (error) {
        console.error('[cleanupLegacyMeals] Error cleaning up legacy meals:', error);
      }
    };

    // Run cleanup once after meals are loaded
    cleanupLegacyMeals();
  }, [user, allPlannedMeals]); // Only run when allPlannedMeals are computed

  // Handle meal type letter click (new compact view)
  const handleMealTypeLetterClick = (date: Date, mealType: MealType, event: React.MouseEvent) => {
    event.stopPropagation();
    const normalizedDate = startOfDay(date);
    const mealsOfType = getMealsForDay(normalizedDate).filter(m => m.mealType === mealType);
    
    if (mealsOfType.length === 0) return;
    
    if (mealsOfType.length === 1) {
      // Single meal: show details directly
      const meal = mealsOfType[0];
      if (meal.dishes && meal.dishes.length === 1) {
        // Single dish: show meal detail modal
        setSelectedDish({ dish: meal.dishes[0], meal });
        setShowMealDetailModal(true);
      } else if (meal.dishes && meal.dishes.length > 1) {
        // Multiple dishes: show dish list modal
        setSelectedDay(normalizedDate);
        setSelectedMealType(mealType);
        setShowDishList(true);
      }
    } else {
      // Multiple meals: show meal selection modal
      setSelectedDay(normalizedDate);
      setSelectedMealType(mealType);
      setShowMealSelectionModal(true);
    }
  };

  // Handle meal click from meal selection modal
  const handleMealSelectionClick = (meal: PlannedMeal) => {
    setShowMealSelectionModal(false);
    if (meal.dishes && meal.dishes.length === 1) {
      // Single dish: show meal detail modal
      setSelectedDish({ dish: meal.dishes[0], meal });
      setShowMealDetailModal(true);
    } else if (meal.dishes && meal.dishes.length > 1) {
      // Multiple dishes: show dish list modal
      setSelectedMealType(meal.mealType);
      setShowDishList(true);
    }
  };

  // Handle day click (only when not clicking on a meal indicator)
  const handleDayClick = (date: Date) => {
    const normalizedDate = startOfDay(date);
    setSelectedDay(normalizedDate);
    const dayMeals = getMealsForDay(normalizedDate);
    
    // If we have a favorite recipe, always show meal type selection first
    // Otherwise, if there are meals for this day, show the day meals modal
    // Otherwise, show the meal type selection modal
    if (favoriteRecipe) {
      setShowMealTypeSelection(true);
    } else if (dayMeals.length > 0) {
      setShowDayMealsModal(true);
    } else {
      setShowMealTypeSelection(true);
    }
  };

  // Handle meal type selection
  const handleMealTypeSelect = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setShowMealTypeSelection(false);
    setShowIngredientPicker(true);
  };

  // Handle add dish
  const handleAddDish = (mealType?: MealType) => {
    if (mealType) {
      setSelectedMealType(mealType);
    }
    setShowDishList(false);
    setShowMealTypeSelection(false);
    setShowIngredientPicker(true);
  };

  // Handle add meal (when no meals exist for the day)
  const handleAddMeal = () => {
    setShowDishList(false);
    setShowMealTypeSelection(true);
  };

  // Drag and drop handlers
  const handleDragEnd = () => {
    setDraggedMeal(null);
    setDragOverDate(null);
    setDragOverMealType(null);
    setIsDragging(false);
  };

  const canDropMeal = (date: Date, mealType: MealType): boolean => {
    if (!draggedMeal) return false;
    
    // Can't drop on the same day and meal type
    if (isSameDay(date, draggedMeal.sourceDate) && mealType === draggedMeal.meal.mealType) {
      return false;
    }
    
    // Check if target day already has a meal of this type
    const targetDayMeals = getMealsForDay(date);
    const hasMealOfType = targetDayMeals.some(m => m.mealType === mealType);
    
    return !hasMealOfType;
  };

  const handleDragOver = (date: Date, mealType: MealType, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (canDropMeal(date, mealType)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverDate(date);
      setDragOverMealType(mealType);
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDragOverDate(null);
      setDragOverMealType(null);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
    setDragOverMealType(null);
  };

  const moveMealToDate = async (sourceDate: Date, sourceMealType: MealType, targetDate: Date, targetMealType: MealType) => {
    if (!user) return;

    try {
      // Get source meal
      const sourceMeal = getMealForDayAndType(sourceDate, sourceMealType);
      if (!sourceMeal || !sourceMeal.dishes || sourceMeal.dishes.length === 0) {
        console.error('[moveMealToDate] Source meal not found or has no dishes');
        return;
      }

      // Get source meal plan
      const sourceWeekStart = startOfWeek(sourceDate, { weekStartsOn: 0 });
      sourceWeekStart.setHours(0, 0, 0, 0);
      let sourceMealPlan = await mealPlanningService.getMealPlan(user.uid, sourceWeekStart);
      
      if (!sourceMealPlan) {
        console.error('[moveMealToDate] Source meal plan not found');
        return;
      }

      // Get target meal plan
      const targetWeekStart = startOfWeek(targetDate, { weekStartsOn: 0 });
      targetWeekStart.setHours(0, 0, 0, 0);
      let targetMealPlan = await mealPlanningService.getMealPlan(user.uid, targetWeekStart);
      
      if (!targetMealPlan) {
        targetMealPlan = await mealPlanningService.createMealPlan(user.uid, targetWeekStart, []);
      }

      // Get or create target meal
      let targetMeal = targetMealPlan.meals.find(
        m => isSameDay(m.date, targetDate) && m.mealType === targetMealType
      );

      if (!targetMeal) {
        const targetMealId = `meal-${Date.now()}`;
        targetMeal = {
          id: targetMealId,
          date: targetDate,
          mealType: targetMealType,
          finishBy: sourceMeal.finishBy || '18:00',
          confirmed: false,
          skipped: false,
          isLeftover: false,
          dishes: []
        };
        targetMealPlan.meals.push(targetMeal);
      }

      // Move all dishes from source to target
      const dishesToMove = [...(sourceMeal.dishes || [])];
      targetMeal.dishes = [...(targetMeal.dishes || []), ...dishesToMove];

      // Remove source meal entirely (since all dishes are moved)
      const sourceMealIndex = sourceMealPlan.meals.findIndex(m => m.id === sourceMeal.id);
      if (sourceMealIndex >= 0) {
        sourceMealPlan.meals.splice(sourceMealIndex, 1);
      }

      // Update both meal plans
      await mealPlanningService.updateMealPlan(sourceMealPlan.id, { meals: sourceMealPlan.meals });
      await mealPlanningService.updateMealPlan(targetMealPlan.id, { meals: targetMealPlan.meals });

      console.log('[moveMealToDate] Successfully moved meal', {
        from: { date: sourceDate, type: sourceMealType },
        to: { date: targetDate, type: targetMealType },
        dishesMoved: dishesToMove.length
      });
    } catch (error) {
      console.error('[moveMealToDate] Error moving meal:', error);
      throw error;
    }
  };

  const handleDrop = async (date: Date, mealType: MealType, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedMeal || !canDropMeal(date, mealType)) {
      return;
    }

    try {
      await moveMealToDate(
        draggedMeal.sourceDate,
        draggedMeal.meal.mealType,
        date,
        mealType
      );
      
      showToast('Meal moved successfully', 'success');
      
      // Clean up drag state
      handleDragEnd();
    } catch (error) {
      console.error('[handleDrop] Error dropping meal:', error);
      showToast('Failed to move meal. Please try again.', 'error');
      handleDragEnd();
    }
  };

  // Navigate periods (months)
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    // Navigate by month
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please log in to view planned meals.</p>
      </div>
    );
  }

  // Show upgrade modal if not premium
  if (isPremium === false) {
    return (
      <>
        <Banner showHomeIcon={true} showLogo={false} onMenuClick={() => setMenuOpen(true)} />
        <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <div style={{ 
          padding: '3rem 2rem', 
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
              Meal Planner - Premium Feature
            </h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '1rem' }}>
              Unlock AI-powered meal planning with automatic ingredient extraction from recipe URLs. 
              Get smart ingredient lists with quantities, and automatically add items to your shopping list.
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                Premium Features:
              </h3>
              <ul style={{ textAlign: 'left', margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>AI-powered recipe ingredient extraction</li>
                <li>Automatic quantity and amount parsing</li>
                <li>Smart shopping list integration</li>
                <li>Meal planning calendar</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/settings')}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#002B4D',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      </>
    );
  }

  if (loading || isPremium === null) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading planned meals...</p>
      </div>
    );
  }

  return (
    <>
      {/* Fixed Header: Banner and Navigation Buttons */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <Banner showHomeIcon={true} showLogo={false} onMenuClick={() => setMenuOpen(true)} />

        {/* Lists, Items, and Plan Buttons */}
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '1rem', justifyContent: 'center', position: 'relative' }}>
          <button
            onClick={() => navigate('/shop')}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '120px'
            }}
          >
            Lists
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '120px'
            }}
          >
            Items
          </button>
          <button
            onClick={() => {
              // Already on Plan page, just scroll to top
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#002B4D',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '120px'
            }}
          >
            Plan
          </button>
        </div>
      </div>
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', width: '100%', boxSizing: 'border-box', marginTop: '160px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Planned Meal Calendar</h2>
        
        {/* Navigation and View Controls */}
        <CalendarNavigation
          currentDate={currentDate}
          onNavigatePeriod={navigatePeriod}
        />

        {/* Calendar Grid */}
        <CalendarGrid
          currentDate={currentDate}
          allPlannedMeals={allPlannedMeals}
          isDragging={isDragging}
          draggedMeal={draggedMeal}
          dragOverDate={dragOverDate}
          dragOverMealType={dragOverMealType}
          onDayClick={handleDayClick}
          onMealTypeClick={handleMealTypeLetterClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          canDropMeal={canDropMeal}
          getMealsForDay={getMealsForDay}
        />

        {/* Legend */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
            Tap on any day to add or edit meals for that day.
          </p>
        </div>
      </div>

      {/* Meal Type Selection Modal */}
      {showMealTypeSelection && selectedDay && (
        <MealTypeSelectionModal
          isOpen={showMealTypeSelection}
          onClose={() => {
            setShowMealTypeSelection(false);
            setSelectedDay(null);
            // Clear favorite recipe when closing meal type selection
            if (favoriteRecipe) {
              setFavoriteRecipe(null);
            }
          }}
          onSelectMealType={handleMealTypeSelect}
          date={selectedDay}
        />
      )}

      {/* Dish List Modal - Shows dishes for a specific meal type */}
      {showDishList && selectedDay && selectedMealType && (
        <DishListModal
          isOpen={showDishList}
          onClose={() => {
            setShowDishList(false);
            setSelectedMealType(null);
            setSelectedDay(null);
          }}
          date={selectedDay}
          mealType={selectedMealType}
          meal={getMealForDayAndType(selectedDay, selectedMealType)}
          onDishClick={(dish) => {
            const meal = getMealForDayAndType(selectedDay, selectedMealType);
            if (meal) {
              setSelectedDish({ dish, meal });
              setShowDishList(false);
              setShowMealDetailModal(true);
            }
          }}
          onAddDish={() => {
            setShowDishList(false);
            setShowIngredientPicker(true);
          }}
        />
      )}

      {/* Day Meals Modal - Shows all meals for a day (only when clicking day, not meal indicator) */}
      {showDayMealsModal && selectedDay && (
        <DayMealsModal
          isOpen={showDayMealsModal}
          onClose={() => {
            setShowDayMealsModal(false);
            setSelectedDay(null);
          }}
          date={selectedDay}
          meals={getMealsForDay(selectedDay)}
          onDishClick={(dish, meal) => {
            setSelectedDish({ dish, meal });
            setShowDayMealsModal(false);
            setShowMealDetailModal(true);
          }}
          onAddDish={handleAddDish}
          onAddMeal={handleAddMeal}
        />
      )}

      {/* Ingredient Picker Modal */}
      {showIngredientPicker && selectedDay && selectedMealType && (
        <IngredientPickerModal
          isOpen={showIngredientPicker}
          onClose={() => {
            setShowIngredientPicker(false);
            setSelectedMealType(null);
            setSelectedDay(null);
            setFavoriteRecipe(null);
            refreshMealPlans();
          }}
          selectedDate={selectedDay}
          initialMealType={selectedMealType}
          favoriteRecipe={favoriteRecipe}
        />
      )}

      {/* Meal Selection Modal - Shows list when multiple meals of same type */}
      {showMealSelectionModal && selectedDay && selectedMealType && (
        <MealSelectionModal
          isOpen={showMealSelectionModal}
          onClose={() => {
            setShowMealSelectionModal(false);
            setSelectedMealType(null);
            setSelectedDay(null);
          }}
          date={selectedDay}
          mealType={selectedMealType}
          meals={getMealsForDay(selectedDay).filter(m => m.mealType === selectedMealType)}
          onMealClick={handleMealSelectionClick}
        />
      )}

      {/* Meal Detail Modal */}
      {showMealDetailModal && selectedDish && (
        <MealDetailModal
          isOpen={showMealDetailModal}
          onClose={() => {
            setShowMealDetailModal(false);
            setSelectedDish(null);
            refreshMealPlans();
          }}
          dish={selectedDish.dish}
          meal={selectedDish.meal}
          onDishDeleted={refreshMealPlans}
        />
      )}
    </>
  );
};

export default PlannedMealCalendar;
