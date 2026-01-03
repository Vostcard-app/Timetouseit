/**
 * OpenAI Service
 * Handles AI-powered meal planning using OpenAI API via Netlify Function
 */

import type {
  MealSuggestion,
  MealPlanningContext,
  ReplanningContext,
  MealType
} from '../types/mealPlan';

/**
 * Call OpenAI API via Netlify Function
 */
async function callOpenAI(messages: Array<{ role: string; content: string }>, model: string = 'gpt-3.5-turbo'): Promise<any> {
  const functionUrl = '/.netlify/functions/openai-proxy';
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        
        // Provide more specific error messages
        if (response.status === 500 && errorMessage.includes('API key not configured')) {
          errorMessage = 'OpenAI API key not configured in Netlify. Please add OPENAI_API_KEY to your Netlify environment variables.';
        } else if (response.status === 404) {
          errorMessage = 'Netlify Function not found. The OpenAI proxy function may not be deployed.';
        }
      } catch (e) {
        // If we can't parse the error, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach the OpenAI proxy function. Please check your connection and ensure the Netlify Function is deployed.');
    }
    throw error;
  }
}

/**
 * Generate meal suggestions using AI
 */
export async function generateMealSuggestions(
  context: MealPlanningContext
): Promise<MealSuggestion[]> {
  try {
    // Build prompt for meal planning
    // Extract target meal type from schedule if available
    const targetMealType = context.schedule[0]?.meals[0]?.type;
    const prompt = buildMealPlanningPrompt(context, targetMealType);

    const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo';
    
    const response = await callOpenAI([
      {
        role: 'system',
        content: 'You are a helpful meal planning assistant. Suggest meals that use expiring ingredients and match user preferences. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], model);

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return parsed.meals || [];
  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    throw error;
  }
}

/**
 * Replan meals after unplanned events
 */
export async function replanMeals(
  context: ReplanningContext
): Promise<MealSuggestion[]> {
  try {
    const prompt = buildReplanningPrompt(context);
    const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo';

    const response = await callOpenAI([
      {
        role: 'system',
        content: 'You are a helpful meal planning assistant. Replan meals to prevent food waste after schedule changes. Prioritize items at risk of expiring. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], model);

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return parsed.meals || [];
  } catch (error) {
    console.error('Error replanning meals:', error);
    throw error;
  }
}

/**
 * Build meal planning prompt
 */
function buildMealPlanningPrompt(context: MealPlanningContext, targetMealType?: MealType): string {
  const expiringItemsList = context.expiringItems
    .map(item => {
      const date = item.expirationDate || item.thawDate;
      const daysUntil = date ? Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 'unknown';
      return `- ${item.name} (expires in ${daysUntil} days, category: ${item.category || 'unknown'})`;
    })
    .join('\n');

  const leftoverMealsList = context.leftoverMeals
    .map(meal => `- ${meal.mealName} (${meal.quantity}, ingredients: ${meal.ingredients.join(', ')})`)
    .join('\n');

  const scheduleList = context.schedule
    .map(day => {
      const dateStr = day.date.toLocaleDateString();
      const meals = day.meals.map(m => `${m.type} by ${m.finishBy}`).join(', ');
      return `- ${dateStr}: ${meals}`;
    })
    .join('\n');

  const targetDate = context.schedule[0]?.date;
  const targetDateStr = targetDate ? targetDate.toLocaleDateString() : 'the specified date';
  const mealTypeInstruction = targetMealType 
    ? `Generate exactly 3 meal suggestions for ${targetMealType} on ${targetDateStr}.`
    : 'Generate meal suggestions for the upcoming week.';

  const priorityInstruction = context.expiringItems.length > 0
    ? 'PRIORITIZE using expiring items and leftovers to prevent waste.'
    : 'Since there are no expiring items, base suggestions on user preferences and favorite meals.';

  return `${mealTypeInstruction} ${priorityInstruction}

Based on the following information:

EXPIRING ITEMS (use these soon to prevent waste):
${expiringItemsList || 'None'}

AVAILABLE LEFTOVER MEALS:
${leftoverMealsList || 'None'}

USER PREFERENCES:
- Disliked foods: ${context.userPreferences.dislikedFoods.join(', ') || 'None'}
- Dietary preferences: ${context.userPreferences.foodPreferences.join(', ') || 'None'}
- Diet approach: ${context.userPreferences.dietApproach || 'None'}${context.userPreferences.dietApproach && context.userPreferences.dietStrict ? ' (STRICT - must strictly adhere to all diet criteria)' : ''}
- Favorite meals: ${context.userPreferences.favoriteMeals.join(', ') || 'None'}
- Serving size: ${context.userPreferences.servingSize} people
- Meal duration preferences: Breakfast ${context.userPreferences.mealDurationPreferences.breakfast} min, Lunch ${context.userPreferences.mealDurationPreferences.lunch} min, Dinner ${context.userPreferences.mealDurationPreferences.dinner} min

SCHEDULE:
${scheduleList}

CURRENT INVENTORY:
${context.currentInventory.map(item => `- ${item.name}`).join('\n') || 'None'}

Generate meal suggestions that:
1. Prioritize using expiring items and leftovers
2. Match user preferences and dietary restrictions
${context.userPreferences.dietApproach && context.userPreferences.dietStrict 
  ? `3. STRICTLY adhere to ${context.userPreferences.dietApproach} guidelines. Do not suggest any meals that violate the diet's core principles.`
  : context.userPreferences.dietApproach 
    ? `3. Consider ${context.userPreferences.dietApproach} preferences but allow flexibility.`
    : '3. Include favorite meals when appropriate'}
${context.userPreferences.dietApproach && context.userPreferences.dietStrict ? '4' : '4'}. ${context.userPreferences.dietApproach && !context.userPreferences.dietStrict ? 'Include favorite meals when appropriate' : `Plan for ${context.userPreferences.servingSize} servings per meal`}
${context.userPreferences.dietApproach && context.userPreferences.dietStrict ? '5' : '5'}. ${context.userPreferences.dietApproach && !context.userPreferences.dietStrict ? `Plan for ${context.userPreferences.servingSize} servings per meal` : 'Fit the schedule (consider meal duration preferences)'}
${context.userPreferences.dietApproach && context.userPreferences.dietStrict ? '6' : '6'}. ${context.userPreferences.dietApproach && !context.userPreferences.dietStrict ? 'Fit the schedule (consider meal duration preferences)' : 'Use items from current inventory when possible'}
${context.userPreferences.dietApproach && context.userPreferences.dietStrict ? '7' : '7'}. ${context.userPreferences.dietApproach && !context.userPreferences.dietStrict ? 'Use items from current inventory when possible' : 'Suggest shopping list items only when necessary'}
${context.userPreferences.dietApproach && context.userPreferences.dietStrict ? '8. Suggest shopping list items only when necessary' : ''}

IMPORTANT: Generate exactly 3 meal suggestions for ${context.schedule[0]?.meals.find(m => m.type === 'breakfast' || m.type === 'lunch' || m.type === 'dinner')?.type || 'this meal type'}.

Return a JSON object with this structure:
{
  "meals": [
    {
      "mealName": "Meal name",
      "mealType": "breakfast|lunch|dinner",
      "date": "YYYY-MM-DD",
      "suggestedIngredients": ["ingredient1", "ingredient2"],
      "usesExpiringItems": ["itemId1", "itemId2"],
      "usesLeftovers": ["leftoverId1"],
      "reasoning": "Why this meal was suggested",
      "priority": "high|medium|low"
    }
  ]
}

Generate exactly 3 different meal suggestions.`;
}

/**
 * Build replanning prompt
 */
function buildReplanningPrompt(context: ReplanningContext): string {
  const wasteRiskList = context.wasteRiskItems
    .map(item => `- ${item.name} (expires in ${item.daysUntilExpiration} days)`)
    .join('\n');

  const skippedMealsList = context.skippedMeals
    .map(meal => `- ${meal.mealName} on ${meal.date.toLocaleDateString()} (${meal.mealType})`)
    .join('\n');

  const basePrompt = buildMealPlanningPrompt(context);

  return `${basePrompt}

UNPLANNED EVENT:
- Date: ${context.unplannedEvent.date.toLocaleDateString()}
- Affected meals: ${context.unplannedEvent.mealTypes.join(', ')}
- Reason: ${context.unplannedEvent.reason}

SKIPPED MEALS (these meals were cancelled):
${skippedMealsList}

ITEMS AT RISK OF WASTE (prioritize these):
${wasteRiskList}

IMPORTANT: Generate new meal suggestions that:
1. Use items at risk of waste FIRST (highest priority)
2. Replace the skipped meals with new suggestions
3. Ensure no food goes to waste due to expiration
4. Consider leftover meals as alternatives
5. Adjust shopping list to account for items now available from skipped meals`;
}

