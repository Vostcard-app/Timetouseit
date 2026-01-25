/**
 * Ingredient Picker Modal
 * Popup modal for selecting ingredients for meal planning with tabs
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebaseConfig';
import { foodItemService, shoppingListService, shoppingListsService, mealPlanningService, recipeImportService, recipeSiteService, favoriteRecipeService } from '../../services';
import type { MealType, Dish } from '../../types';
import type { RecipeImportResult } from '../../types/recipeImport';
import type { RecipeSite } from '../../types/recipeImport';
import type { FavoriteRecipe } from '../../types/favoriteRecipe';
import { isDryCannedItem } from '../../utils/storageUtils';
import { addDays, startOfWeek, isSameDay } from 'date-fns';
import { detectCategory, type FoodCategory } from '../../utils/categoryUtils';
import { useIngredientAvailability } from '../../hooks/useIngredientAvailability';
import { GoogleSearchRecipeModal } from './GoogleSearchRecipeModal';
import { SaveDishModal } from './SaveDishModal';
import { MyIngredientsTab } from './MyIngredientsTab';
import { RecipeUrlTab } from './RecipeUrlTab';
import { PasteIngredientsTab } from './PasteIngredientsTab';
import { showToast } from '../Toast';
import { parseIngredientQuantity, cleanIngredientName } from '../../utils/ingredientQuantityParser';
import { capitalizeItemName } from '../../utils/formatting';
import { BaseModal } from '../ui/BaseModal';
import { buttonStyles, combineStyles } from '../../styles/componentStyles';
import { spacing } from '../../styles/designTokens';

interface IngredientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  initialMealType?: MealType;
  favoriteRecipe?: FavoriteRecipe | null;
}

interface IngredientItem {
  id: string;
  name: string;
  source: 'bestBySoon' | 'shopList' | 'perishable' | 'dryCanned';
  bestByDate?: Date | null; // For sorting by best by date
  category?: 'Proteins' | 'Vegetables' | 'Fruits' | 'Dairy' | 'Leftovers' | 'Other';
  originalItemId?: string; // Original FoodItem ID for perishable items (for category updates)
  isReserved?: boolean; // Whether this item is reserved for a dish
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' }
];


export const IngredientPickerModal: React.FC<IngredientPickerModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  initialMealType,
  favoriteRecipe
}) => {
  const [user] = useAuthState(auth);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [activeTab, setActiveTab] = useState<'myIngredients' | 'recipeUrl' | 'pasteIngredients'>('myIngredients');
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipeUrl, setRecipeUrl] = useState('');
  const [pastedIngredients, setPastedIngredients] = useState('');
  const [parsedIngredients, setParsedIngredients] = useState<string[]>([]);
  const [selectedPastedIngredientIndices, setSelectedPastedIngredientIndices] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [importingRecipe, setImportingRecipe] = useState(false);
  const [importedRecipe, setImportedRecipe] = useState<RecipeImportResult | null>(null);
  const [recipeImportError, setRecipeImportError] = useState(false);
  const [favoriteWebsites, setFavoriteWebsites] = useState<RecipeSite[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingCategoryItemId, setEditingCategoryItemId] = useState<string | null>(null);
  const categoryOptions: FoodCategory[] = ['Proteins', 'Vegetables', 'Fruits', 'Dairy', 'Leftovers', 'Other'];
  const [selectedFavoriteSite, setSelectedFavoriteSite] = useState<RecipeSite | null>(null);
  const [selectedSearchIngredients, setSelectedSearchIngredients] = useState<Set<string>>(new Set());
  const [showGoogleSearchRecipeModal, setShowGoogleSearchRecipeModal] = useState(false);
  const [showSaveDishModal, setShowSaveDishModal] = useState(false);

  // Parse pasted ingredients when text changes
  useEffect(() => {
    if (!pastedIngredients.trim()) {
      setParsedIngredients([]);
      setSelectedPastedIngredientIndices(new Set());
      return;
    }

    // Split by newlines, commas, or semicolons, then clean up each ingredient
    const lines = pastedIngredients
      .split(/[\n,;]/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    setParsedIngredients(lines);
    // Select all by default
    setSelectedPastedIngredientIndices(new Set(lines.map((_, index) => index)));
  }, [pastedIngredients]);

  // Use ingredient availability hook for pasted ingredients
  const {
    ingredientStatuses: pastedIngredientStatuses,
    loading: loadingPastedIngredients
  } = useIngredientAvailability(
    parsedIngredients,
    { isOpen: isOpen && parsedIngredients.length > 0 }
  );

  // Set default selections for pasted ingredients (unavailable items selected by default)
  useEffect(() => {
    if (parsedIngredients.length === 0 || pastedIngredientStatuses.length === 0) return;
    
    // Only set default selections on initial parse (when all are selected)
    const allSelected = selectedPastedIngredientIndices.size === parsedIngredients.length;
    if (!allSelected) return; // Respect user's manual selections
    
    const unavailableIndices = pastedIngredientStatuses
      .filter(item => item.status === 'missing' || item.status === 'partial')
      .map(item => item.index);
    
    if (unavailableIndices.length > 0) {
      setSelectedPastedIngredientIndices(new Set(unavailableIndices));
    }
  }, [pastedIngredientStatuses.length, parsedIngredients.length]); // Only depend on lengths to avoid infinite loops

  const togglePastedIngredient = (index: number) => {
    const newSelected = new Set(selectedPastedIngredientIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPastedIngredientIndices(newSelected);
  };

  // Load ingredients from all sources
  useEffect(() => {
    if (!isOpen || !user) {
      setLoading(false);
      return;
    }

        const loadIngredients = async () => {
          try {
            setLoading(true);
            const allIngredients: IngredientItem[] = [];

            // Load planned meals to check if items are reserved
            const plannedMeals = await mealPlanningService.loadAllPlannedMealsForMonth(user.uid);
            
            // Helper function to check if item is reserved (by usedByMeals or by meal plan)
            const isItemReserved = (item: { id: string; usedByMeals?: string[] }): boolean => {
              // Check usedByMeals field first
              if (item.usedByMeals && item.usedByMeals.length > 0) {
                return true;
              }
              
              // Fallback: Check if item is claimed by any dish in planned meals
              for (const meal of plannedMeals) {
                if (meal.dishes) {
                  for (const dish of meal.dishes) {
                    if (dish.claimedItemIds && dish.claimedItemIds.includes(item.id)) {
                      return true;
                    }
                  }
                }
              }
              
              return false;
            };

            // 1. Load best by soon items (next 14 days)
        const allFoodItems = await foodItemService.getFoodItems(user.uid);
        const now = new Date();
        const twoWeeksFromNow = addDays(now, 14);
        
        const bestBySoonItems = allFoodItems.filter(item => {
          const expDate = item.bestByDate || item.thawDate;
          if (!expDate) return false;
          // Include all items, even if reserved
          return expDate >= now && expDate <= twoWeeksFromNow;
        });

        bestBySoonItems.forEach(item => {
          allIngredients.push({
            id: `bestBySoon-${item.id}`,
            name: item.name,
            source: 'bestBySoon',
            bestByDate: item.bestByDate || item.thawDate || null,
            category: (item.category as FoodCategory) || detectCategory(item.name),
            // Only set originalItemId for perishable items (not dry/canned)
            // This ensures the edit icon only appears on perishable items
            originalItemId: !isDryCannedItem(item) ? item.id : undefined,
            isReserved: isItemReserved(item)
          });
        });

        // 2. Load default shop list
        const shoppingLists = await shoppingListsService.getShoppingLists(user.uid);
        const defaultList = shoppingLists.find(list => list.isDefault) || shoppingLists[0];
        
        if (defaultList) {
          const shopListItems = await shoppingListService.getShoppingListItems(user.uid, defaultList.id);
          // Include non-crossed-off items (even if reserved)
          shopListItems
            .filter(item => !item.crossedOff)
            .forEach(item => {
              allIngredients.push({
                id: `shopList-${item.id}`,
                name: item.name,
                source: 'shopList',
                isReserved: !!item.mealId
              });
            });
        }

        // 3. Load perishable items (not dry/canned)
        const perishableItems = allFoodItems.filter(item => 
          !isDryCannedItem(item)
        );
        perishableItems.forEach(item => {
          allIngredients.push({
            id: `perishable-${item.id}`,
            name: item.name,
            source: 'perishable',
            bestByDate: item.bestByDate || item.thawDate || null,
            category: (item.category as FoodCategory) || detectCategory(item.name),
            originalItemId: item.id,
            isReserved: isItemReserved(item)
          });
        });

        // 4. Load dry/canned items
        const dryCannedItems = allFoodItems.filter(item => 
          isDryCannedItem(item)
        );
        dryCannedItems.forEach(item => {
          allIngredients.push({
            id: `dryCanned-${item.id}`,
            name: item.name,
            source: 'dryCanned',
            bestByDate: item.bestByDate || item.thawDate || null,
            isReserved: isItemReserved(item)
          });
        });

        // Remove duplicates (same name)
        const uniqueIngredients: IngredientItem[] = [];
        const seenNames = new Set<string>();
        
        allIngredients.forEach(ingredient => {
          const normalizedName = ingredient.name.toLowerCase().trim();
          if (!seenNames.has(normalizedName)) {
            seenNames.add(normalizedName);
            uniqueIngredients.push(ingredient);
          }
        });

        setIngredients(uniqueIngredients);
      } catch (error) {
        console.error('Error loading ingredients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadIngredients();
  }, [isOpen, user]);

  // Combine all selected ingredients from different tabs
  const combinedIngredients = useMemo(() => {
    const combined: string[] = [];
    
    // From "My Ingredients" tab
    Array.from(selectedIngredients).forEach(id => {
      const ingredient = ingredients.find(ing => ing.id === id);
      if (ingredient) {
        combined.push(ingredient.name);
      }
    });
    
    // From "Paste Ingredients" tab
    Array.from(selectedPastedIngredientIndices).forEach(index => {
      if (parsedIngredients[index]) {
        combined.push(parsedIngredients[index]);
      }
    });
    
    // Remove duplicates
    return Array.from(new Set(combined));
  }, [selectedIngredients, ingredients, selectedPastedIngredientIndices, parsedIngredients]);

  // Use ingredient availability hook for combined ingredients (for SaveDishModal)
  const {
    pantryItems,
    shoppingListItems
  } = useIngredientAvailability(
    combinedIngredients,
    { isOpen: isOpen && combinedIngredients.length > 0 && selectedMealType !== null }
  );

  // Toggle search ingredient selection (max 3)
  const toggleSearchIngredient = (ingredient: string) => {
    const newSelected = new Set(selectedSearchIngredients);
    if (newSelected.has(ingredient)) {
      newSelected.delete(ingredient);
    } else {
      if (newSelected.size >= 3) {
        showToast('You can only select up to 3 ingredients for search', 'warning');
        return;
      }
      newSelected.add(ingredient);
    }
    setSelectedSearchIngredients(newSelected);
  };

  // Handle favorite website selection
  const handleFavoriteSiteSelect = (site: RecipeSite) => {
    setSelectedFavoriteSite(site);
    setRecipeUrl(site.baseUrl);
  };

  // Handle View button click
  const handleViewFavoriteSite = () => {
    if (selectedFavoriteSite) {
      window.open(selectedFavoriteSite.baseUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle Google search button click
  const handleGoogleSearch = () => {
    if (selectedSearchIngredients.size === 0) {
      showToast('Please select at least one ingredient to search', 'warning');
      return;
    }
    if (selectedSearchIngredients.size > 3) {
      showToast('Please select no more than 3 ingredients', 'warning');
      return;
    }
    // Build Google search URL and open in new tab
    const ingredients = Array.from(selectedSearchIngredients);
    const query = `${ingredients.join(' ')} recipe`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
  };

  // Handle recipe imported from Google search modal
  const handleRecipeImported = (recipe: RecipeImportResult) => {
    // Add imported ingredients to parsed ingredients and auto-select them
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      setParsedIngredients(prev => {
        const newIngredients = recipe.ingredients!
          .map(ing => ing.trim())
          .filter(ing => ing.length > 0 && !prev.includes(ing));
        
        // Auto-select all new ingredients
        setSelectedPastedIngredientIndices(prevSelected => {
          const newSelected = new Set(prevSelected);
          const currentLength = prev.length;
          newIngredients.forEach((_, index) => {
            newSelected.add(currentLength + index);
          });
          return newSelected;
        });
        
        return [...prev, ...newIngredients];
      });
    }
    
    // Set recipe URL and imported recipe
    if (recipe.sourceUrl) {
      setRecipeUrl(recipe.sourceUrl);
      setImportedRecipe(recipe);
    }
  };

  // Set initial meal type if provided
  useEffect(() => {
    if (isOpen && initialMealType) {
      setSelectedMealType(initialMealType);
    }
  }, [isOpen, initialMealType]);

  // Handle favorite recipe when modal opens
  useEffect(() => {
    if (isOpen && favoriteRecipe) {
      // If we have a recipe URL and no imported recipe yet, auto-import it (same as manual URL import)
      if (favoriteRecipe.recipeSourceUrl && !importedRecipe && user) {
        setRecipeUrl(favoriteRecipe.recipeSourceUrl);
        setActiveTab('recipeUrl');
        
        // Auto-import the recipe from URL
        const autoImport = async () => {
          if (!user || !favoriteRecipe.recipeSourceUrl) return;
          setImportingRecipe(true);
          try {
            const recipe = await recipeImportService.importRecipe(favoriteRecipe.recipeSourceUrl, user.uid);
            setImportedRecipe(recipe);
            
            // Open SaveDishModal if meal type is selected and ingredients found
            if (selectedMealType && recipe.ingredients && recipe.ingredients.length > 0) {
              setShowSaveDishModal(true);
            }
          } catch (error: unknown) {
            console.error('Error auto-importing recipe:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to import recipe. Please try again.';
            showToast(errorMessage, 'error');
          } finally {
            setImportingRecipe(false);
          }
        };
        
        autoImport();
      } else if (favoriteRecipe.recipeIngredients && favoriteRecipe.recipeIngredients.length > 0 && !importedRecipe) {
        // If no URL, use paste ingredients tab
        const ingredientsText = favoriteRecipe.recipeIngredients.join('\n');
        setPastedIngredients(ingredientsText);
        setActiveTab('pasteIngredients');
        
        // Create RecipeImportResult-like object from favorite recipe
        const recipeData: RecipeImportResult = {
          title: favoriteRecipe.recipeTitle || favoriteRecipe.dishName,
          ingredients: favoriteRecipe.recipeIngredients,
          sourceUrl: favoriteRecipe.recipeSourceUrl || '',
          sourceDomain: favoriteRecipe.recipeSourceDomain || '',
          imageUrl: favoriteRecipe.recipeImageUrl || undefined,
          parsedIngredients: favoriteRecipe.parsedIngredients
        };
        setImportedRecipe(recipeData);
        
        // If meal type is already selected, open SaveDishModal
        if (selectedMealType && recipeData.ingredients && recipeData.ingredients.length > 0) {
          setShowSaveDishModal(true);
        }
      }
    }
  }, [isOpen, favoriteRecipe, selectedMealType, user, importedRecipe]);

  // Helper function to validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  // Handle Get Ingredients button click
  const handleGetIngredients = async () => {
    const trimmedUrl = recipeUrl.trim();
    
    // Reset error state on new attempt
    setRecipeImportError(false);
    
    if (!trimmedUrl) {
      showToast('Please enter a recipe URL', 'warning');
      return;
    }
    
    if (!isValidUrl(trimmedUrl)) {
      showToast('Please enter a valid URL', 'error');
      return;
    }
    
    if (!user) {
      showToast('Please log in to import recipes', 'error');
      return;
    }
    
    setImportingRecipe(true);
    try {
      const recipe = await recipeImportService.importRecipe(trimmedUrl, user.uid);
      setImportedRecipe(recipe);
      
      // Open SaveDishModal with imported ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        // Ensure we have a meal type selected
        if (!selectedMealType) {
          showToast('Please select a meal type first', 'warning');
          return;
        }
        setShowSaveDishModal(true);
      } else {
        showToast('No ingredients found in recipe', 'warning');
      }
    } catch (error: any) {
      console.error('Error importing recipe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import recipe. Please try again.';
      showToast(errorMessage, 'error');
      setRecipeImportError(true);
    } finally {
      setImportingRecipe(false);
    }
  };

  // Ensure Google exists as a favorite website
  const ensureGoogleFavorite = async () => {
    try {
      const allSites = await recipeSiteService.getRecipeSites();
      const googleSite = allSites.find(s => 
        s.label.toLowerCase() === 'google' || 
        s.baseUrl.includes('google.com')
      );
      
      if (!googleSite) {
        // Create Google as a favorite
        await recipeSiteService.createRecipeSite({
          label: 'Google',
          baseUrl: 'https://www.google.com',
          searchTemplateUrl: 'https://www.google.com/search?q={query}',
          enabled: true
        });
      } else if (!googleSite.enabled) {
        // Enable Google if it exists but is disabled
        await recipeSiteService.updateRecipeSite(googleSite.id, { enabled: true });
      }
    } catch (error) {
      console.error('Error ensuring Google favorite:', error);
    }
  };

  // Load favorite websites when modal opens
  useEffect(() => {
    if (!isOpen || !user) {
      setFavoriteWebsites([]);
      return;
    }

    const loadFavorites = async () => {
      try {
        setLoadingFavorites(true);
        // Ensure Google exists
        await ensureGoogleFavorite();
        
        // Get all sites and filter for enabled ones (more reliable than ordering by enabled)
        const allSites = await recipeSiteService.getRecipeSites();
        const enabledSites = allSites.filter(site => site.enabled === true);
        // Sort by label, but put Google first
        enabledSites.sort((a, b) => {
          if (a.label.toLowerCase() === 'google') return -1;
          if (b.label.toLowerCase() === 'google') return 1;
          return a.label.localeCompare(b.label);
        });
        setFavoriteWebsites(enabledSites);
        console.log('[IngredientPickerModal] Loaded favorite websites:', enabledSites.length, enabledSites);
      } catch (error) {
        console.error('Error loading favorite websites:', error);
        showToast('Failed to load favorite websites', 'error');
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, [isOpen, user]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMealType(null);
      setActiveTab('myIngredients');
      setSelectedIngredients(new Set());
      setRecipeUrl('');
      setPastedIngredients('');
      setParsedIngredients([]);
      setSelectedPastedIngredientIndices(new Set());
      setImportedRecipe(null);
      setImportingRecipe(false);
      setSelectedFavoriteSite(null);
      setSelectedSearchIngredients(new Set());
      setShowGoogleSearchRecipeModal(false);
      setShowSaveDishModal(false);
      setCategoryFilter('all'); // Reset category filter when modal closes
      setEditingCategoryItemId(null); // Close any open category edit dropdowns
    }
  }, [isOpen]);

  // Helper function to sort ingredients by best by date
  const sortIngredientsByDate = (items: IngredientItem[]): IngredientItem[] => {
    return [...items].sort((a, b) => {
      const dateA = a.bestByDate;
      const dateB = b.bestByDate;
      
      // Items without dates go to the end
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      // Sort by date (earliest first)
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Group ingredients by source and sort by best by date
  const groupedIngredients = useMemo(() => {
    const groups = {
      bestBySoon: [] as IngredientItem[],
      shopList: [] as IngredientItem[],
      perishable: [] as IngredientItem[],
      dryCanned: [] as IngredientItem[]
    };

    ingredients.forEach(ingredient => {
      groups[ingredient.source].push(ingredient);
    });

    // Filter perishable items (both bestBySoon and perishable groups) by category if filter is set
    let filteredBestBySoon = groups.bestBySoon;
    let filteredPerishable = groups.perishable;
    
    if (categoryFilter !== 'all') {
      // Filter "Use Soon" items (these are also perishable items)
      filteredBestBySoon = groups.bestBySoon.filter(item => {
        // Use stored category if available, otherwise auto-detect
        const itemCategory = item.category || detectCategory(item.name);
        return itemCategory === categoryFilter;
      });
      
      // Filter regular perishable items
      filteredPerishable = groups.perishable.filter(item => {
        // Use stored category if available, otherwise auto-detect
        const itemCategory = item.category || detectCategory(item.name);
        return itemCategory === categoryFilter;
      });
    }

    // Sort each group by best by date (earliest first)
    return {
      bestBySoon: sortIngredientsByDate(filteredBestBySoon),
      shopList: groups.shopList, // Shop list items don't have dates, keep current order
      perishable: sortIngredientsByDate(filteredPerishable),
      dryCanned: sortIngredientsByDate(groups.dryCanned)
    };
  }, [ingredients, categoryFilter]);

  const toggleIngredient = (ingredientId: string) => {
    const newSelected = new Set(selectedIngredients);
    
    if (newSelected.has(ingredientId)) {
      newSelected.delete(ingredientId);
    } else {
      // Limit to 3 selections
      if (newSelected.size >= 3) {
        return;
      }
      newSelected.add(ingredientId);
    }
    
    setSelectedIngredients(newSelected);
  };

  const handleCategoryChange = async (ingredientId: string, newCategory: FoodCategory) => {
    if (!user) return;

    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    if (!ingredient || !ingredient.originalItemId) return;

    try {
      // Update the FoodItem in Firestore
      await foodItemService.updateFoodItem(ingredient.originalItemId, {
        category: newCategory
      });

      // Update the local ingredient's category
      setIngredients(prev => prev.map(ing => 
        ing.id === ingredientId ? { ...ing, category: newCategory } : ing
      ));

      // Close the edit dropdown
      setEditingCategoryItemId(null);
      
      showToast('Category updated successfully', 'success');
    } catch (error) {
      console.error('Error updating category:', error);
      showToast('Failed to update category. Please try again.', 'error');
    }
  };

  const handleSaveMeal = async (data: {
    dishName: string;
    ingredients: string[];
    ingredientsToReserve: string[];
    ingredientsForShoppingList: string[];
    additionalIngredients: string[];
    targetListId: string;
    isFavorite: boolean;
  }) => {
    if (!user || !selectedMealType) {
      showToast('Please select a meal type', 'error');
      return;
    }

    setSaving(true);
    try {
      const dishId = `dish-${Date.now()}`;
      const finalDishName = data.dishName;

      // Combine all ingredients (original + additional)
      const allIngredients = data.ingredients;

      // Calculate reserved quantities for this dish (only for ingredients to reserve)
      const reservedQuantities = recipeImportService.calculateMealReservedQuantities(
        data.ingredientsToReserve,
        pantryItems
      );

      // Get or create meal plan for this week
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      weekStart.setHours(0, 0, 0, 0);

      let mealPlan = await mealPlanningService.getMealPlan(user.uid, weekStart);
      
      if (!mealPlan) {
        mealPlan = await mealPlanningService.createMealPlan(user.uid, weekStart, []);
      }

      // Get or create PlannedMeal for this date and meal type
      let plannedMeal = mealPlan.meals.find(
        m => isSameDay(m.date, selectedDate) && m.mealType === selectedMealType
      );

      if (!plannedMeal) {
        // Create new PlannedMeal for this date+mealType
        const mealId = `meal-${Date.now()}`;
        plannedMeal = {
          id: mealId,
          date: selectedDate,
          mealType: selectedMealType,
          finishBy: '18:00',
          confirmed: false,
          skipped: false,
          isLeftover: false,
          dishes: []
        };
      }

      // Claim items from dashboard/pantry for this dish (only ingredients to reserve)
      const claimedItemIds = await recipeImportService.claimItemsForMeal(
        user.uid,
        dishId,
        data.ingredientsToReserve,
        pantryItems,
        reservedQuantities
      );

      // Claim existing shopping list items for this dish (only ingredients to reserve)
      const claimedShoppingListItemIds = await recipeImportService.claimShoppingListItemsForMeal(
        user.uid,
        dishId,
        data.ingredientsToReserve,
        shoppingListItems
      );

      // Add ingredients to shopping list (only selected ones)
      const itemsToAdd = data.ingredientsForShoppingList;
      const newlyAddedItemIds: string[] = [];
      
      if (itemsToAdd.length > 0 && data.targetListId) {
        for (const ingredient of itemsToAdd) {
          // Try to use AI-parsed ingredient data if available from imported recipe
          const ingredientIndex = importedRecipe?.ingredients?.indexOf(ingredient) ?? -1;
          const parsedIngredient = importedRecipe?.parsedIngredients && ingredientIndex >= 0 
            ? importedRecipe.parsedIngredients[ingredientIndex]
            : null;
          
          let itemName: string;
          let quantity: number | undefined;
          let quantityUnit: string | undefined;
          
          if (parsedIngredient) {
            // Use AI-parsed data
            itemName = parsedIngredient.name;
            quantity = parsedIngredient.quantity ?? undefined;
            quantityUnit = parsedIngredient.unit ?? undefined;
          } else {
            // Fallback to manual parsing
            const parsed = parseIngredientQuantity(ingredient);
            const cleanedName = cleanIngredientName(parsed.itemName);
            itemName = capitalizeItemName(cleanedName);
            quantity = parsed.quantity ?? undefined;
            // No unit for manual parsing (non-standard)
          }
          
          const itemId = await shoppingListService.addShoppingListItem(
            user.uid,
            data.targetListId,
            itemName,
            false,
            'meal_plan',
            dishId,
            quantity,
            quantityUnit
          );
          newlyAddedItemIds.push(itemId);
        }
      }

      // Combine claimed and newly added shopping list item IDs
      const allClaimedShoppingListItemIds = [...claimedShoppingListItemIds, ...newlyAddedItemIds];

      // Create the dish
      const dish: Dish = {
        id: dishId,
        dishName: finalDishName,
        recipeTitle: finalDishName,
        recipeIngredients: allIngredients,
        recipeSourceUrl: recipeUrl || null,
        recipeSourceDomain: recipeUrl ? (() => {
          try {
            return new URL(recipeUrl).hostname;
          } catch {
            return null;
          }
        })() : null,
        recipeImageUrl: null,
        reservedQuantities,
        claimedItemIds,
        claimedShoppingListItemIds: allClaimedShoppingListItemIds,
        completed: false
      };

      // Add dish to PlannedMeal
      const updatedDishes = [...(plannedMeal.dishes || []), dish];
      plannedMeal.dishes = updatedDishes;

      // Update or add PlannedMeal to meal plan
      const mealIndex = mealPlan.meals.findIndex(m => m.id === plannedMeal!.id);
      if (mealIndex >= 0) {
        mealPlan.meals[mealIndex] = plannedMeal;
      } else {
        mealPlan.meals.push(plannedMeal);
      }

      await mealPlanningService.updateMealPlan(mealPlan.id, { meals: mealPlan.meals });

      // Save to favorites if requested
      if (data.isFavorite && user) {
        try {
          const favoriteRecipeUrl = importedRecipe?.sourceUrl || recipeUrl || null;
          const recipeDomain = favoriteRecipeUrl ? (() => {
            try {
              return new URL(favoriteRecipeUrl).hostname;
            } catch {
              return null;
            }
          })() : null;

          await favoriteRecipeService.saveFavoriteRecipe(user.uid, {
            dishName: finalDishName,
            recipeTitle: importedRecipe?.title || finalDishName,
            recipeIngredients: allIngredients,
            recipeSourceUrl: favoriteRecipeUrl,
            recipeSourceDomain: recipeDomain,
            recipeImageUrl: importedRecipe?.imageUrl || null,
            parsedIngredients: importedRecipe?.parsedIngredients
          });
        } catch (error) {
          console.error('Error saving favorite recipe:', error);
          // Don't block the main save if favorites save fails
        }
      }

      if (itemsToAdd.length > 0) {
        showToast(`Dish saved and ${itemsToAdd.length} ingredient(s) added to shopping list!`, 'success');
      } else {
        showToast('Dish saved to meal planner successfully!', 'success');
      }

      onClose();
    } catch (error) {
      console.error('Error saving dish:', error);
      showToast('Failed to save dish. Please try again.', 'error');
      setSaving(false);
    }
  };

  const getSourceLabel = (source: IngredientItem['source']): string => {
    switch (source) {
      case 'bestBySoon':
        return 'Use Soon';
      case 'shopList':
        return 'Shop List';
      case 'perishable':
        return 'Perishables';
      case 'dryCanned':
        return 'Dry/Canned Items';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  // Footer button
  const footer = selectedMealType ? (
    <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
      <button
        onClick={onClose}
        disabled={saving}
        style={combineStyles(
          buttonStyles.secondary,
          saving && buttonStyles.disabled
        )}
      >
        Cancel
      </button>
    </div>
  ) : undefined;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Select Ingredients"
        size="large"
        footer={footer}
      >
            {!selectedMealType ? (
              /* Meal Type Selection */
              <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                  Select Meal Type
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {MEAL_TYPES.map(mealType => (
                    <button
                      key={mealType.value}
                      onClick={() => setSelectedMealType(mealType.value)}
                      style={{
                        padding: '1.5rem',
                        backgroundColor: '#f9fafb',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1.125rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#002B4D';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      {mealType.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Tabbed Ingredient Selection */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                      {MEAL_TYPES.find(m => m.value === selectedMealType)?.label}
                    </h3>
                    <button
                      onClick={() => {
                        if (combinedIngredients.length === 0) {
                          showToast('Please add at least one ingredient', 'warning');
                          return;
                        }
                        setShowSaveDishModal(true);
                      }}
                      disabled={saving || combinedIngredients.length === 0}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: saving || combinedIngredients.length === 0 ? '#9ca3af' : '#002B4D',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: saving || combinedIngredients.length === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Create Dish
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedMealType(null)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f3f4f6',
                      color: '#1f2937',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                </div>

                {/* Tab Headers */}
                <div style={{
                  display: 'flex',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  marginBottom: '1.5rem'
                }}>
                  <button
                    onClick={() => setActiveTab('myIngredients')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      border: 'none',
                      backgroundColor: activeTab === 'myIngredients' ? '#ffffff' : 'transparent',
                      borderBottom: activeTab === 'myIngredients' ? '2px solid #002B4D' : 'none',
                      color: activeTab === 'myIngredients' ? '#002B4D' : '#6b7280',
                      fontWeight: activeTab === 'myIngredients' ? '600' : '400',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    My Ingredients
                  </button>
                  <button
                    onClick={() => setActiveTab('recipeUrl')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      border: 'none',
                      backgroundColor: activeTab === 'recipeUrl' ? '#ffffff' : 'transparent',
                      borderBottom: activeTab === 'recipeUrl' ? '2px solid #002B4D' : 'none',
                      color: activeTab === 'recipeUrl' ? '#002B4D' : '#6b7280',
                      fontWeight: activeTab === 'recipeUrl' ? '600' : '400',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Recipe URL
                  </button>
                  <button
                    onClick={() => setActiveTab('pasteIngredients')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      border: 'none',
                      backgroundColor: activeTab === 'pasteIngredients' ? '#ffffff' : 'transparent',
                      borderBottom: activeTab === 'pasteIngredients' ? '2px solid #002B4D' : 'none',
                      color: activeTab === 'pasteIngredients' ? '#002B4D' : '#6b7280',
                      fontWeight: activeTab === 'pasteIngredients' ? '600' : '400',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Add Ingredients
                  </button>
                </div>

                {/* Tab Content */}
                <div style={{ marginBottom: '1.5rem', minHeight: '300px' }}>
                  {activeTab === 'myIngredients' && (
                    <MyIngredientsTab
                      loading={loading}
                      groupedIngredients={groupedIngredients}
                      selectedIngredients={selectedIngredients}
                      onToggleIngredient={toggleIngredient}
                      categoryFilter={categoryFilter}
                      onCategoryFilterChange={setCategoryFilter}
                      categoryOptions={categoryOptions}
                      editingCategoryItemId={editingCategoryItemId}
                      onSetEditingCategoryItemId={setEditingCategoryItemId}
                      onCategoryChange={handleCategoryChange}
                      getSourceLabel={getSourceLabel}
                    />
                  )}

                  {activeTab === 'recipeUrl' && (
                    <RecipeUrlTab
                      recipeUrl={recipeUrl}
                      onRecipeUrlChange={setRecipeUrl}
                      onGetIngredients={handleGetIngredients}
                      importingRecipe={importingRecipe}
                      recipeImportError={recipeImportError}
                      favoriteWebsites={favoriteWebsites}
                      loadingFavorites={loadingFavorites}
                      selectedFavoriteSite={selectedFavoriteSite}
                      onFavoriteSiteSelect={handleFavoriteSiteSelect}
                      onViewFavoriteSite={handleViewFavoriteSite}
                      onGoogleSearch={handleGoogleSearch}
                      combinedIngredients={combinedIngredients}
                      selectedSearchIngredients={selectedSearchIngredients}
                      onToggleSearchIngredient={toggleSearchIngredient}
                      onOpenGoogleSearchModal={() => setShowGoogleSearchRecipeModal(true)}
                      isValidUrl={isValidUrl}
                    />
                  )}

                  {activeTab === 'pasteIngredients' && (
                    <PasteIngredientsTab
                      pastedIngredients={pastedIngredients}
                      onPastedIngredientsChange={setPastedIngredients}
                      parsedIngredients={parsedIngredients}
                      selectedPastedIngredientIndices={selectedPastedIngredientIndices}
                      onTogglePastedIngredient={togglePastedIngredient}
                      loadingPastedIngredients={loadingPastedIngredients}
                      pastedIngredientStatuses={pastedIngredientStatuses}
                    />
                  )}
                </div>


              </div>
            )}
      </BaseModal>

      {/* Google Search Recipe Modal */}
      <GoogleSearchRecipeModal
        isOpen={showGoogleSearchRecipeModal}
        onClose={() => setShowGoogleSearchRecipeModal(false)}
        ingredients={selectedSearchIngredients.size > 0 
          ? Array.from(selectedSearchIngredients) 
          : combinedIngredients.slice(0, 3)}
        onRecipeImported={handleRecipeImported}
      />

      {/* Save Dish Modal */}
      {selectedMealType && (
        <SaveDishModal
          isOpen={showSaveDishModal}
          onClose={() => setShowSaveDishModal(false)}
          onSave={handleSaveMeal}
          ingredients={importedRecipe?.ingredients || combinedIngredients}
          parsedIngredients={importedRecipe?.parsedIngredients}
          selectedDate={selectedDate}
          mealType={selectedMealType}
          recipeUrl={importedRecipe?.sourceUrl || recipeUrl}
          importedRecipeTitle={importedRecipe?.title || null}
        />
      )}
    </>
  );
};
