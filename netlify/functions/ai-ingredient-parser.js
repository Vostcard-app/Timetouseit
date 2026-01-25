/**
 * Netlify Function: AI Ingredient Parser
 * Uses OpenAI to parse ingredient strings and extract name, quantity, and unit
 */

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { ingredients, userId } = body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Ingredients array is required' })
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'OpenAI API key not configured' })
      };
    }

    // Check if this is a premium request (enhanced parsing)
    const isPremium = body.isPremium === true;
    
    // Enhanced prompt for premium users
    const premiumInstructions = isPremium ? `
IMPORTANT FOR PREMIUM USERS:
1. Remove ALL cooking descriptors from ingredient names:
   - Remove: chopped, diced, minced, sliced, grated, crushed, whole, ground, dried, fresh, frozen, canned, raw, cooked, peeled, seeded, stemmed, trimmed, julienned, cubed, shredded, crumbled, mashed, pureed, whipped, beaten, softened, melted, warmed, cooled, room temperature, large, small, medium, extra large, extra small, thin, thick, fine, coarse, rough, smooth, optional, to taste, as needed, for garnish
   - Example: "3 lbs chopped fresh cilantro" → name: "cilantro" (not "chopped fresh cilantro")
2. Format amounts with proper capitalization and spacing:
   - Use capitalized unit abbreviations: "Lbs", "Oz", "Cups", "Tbsp", "Tsp", "G", "Kg", "Ml", "L"
   - Include space between number and unit: "3 Lbs" (not "3lbs" or "3 lb")
   - Example: "3 lbs" → formattedAmount: "3 Lbs"
3. Return clean, normalized ingredient names without descriptors.` : '';
    
    // Build prompt for ingredient parsing
    const prompt = `Parse these recipe ingredients and extract the ingredient name, quantity, unit, and formatted amount separately.

Ingredients to parse:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

For each ingredient, extract:
- name: The clean ingredient name (remove cooking descriptors like "chopped", "diced", "minced", etc.)
- quantity: The numeric quantity (e.g., 2, 1.5, 0.5) or null if no quantity specified
- unit: The unit of measurement (e.g., "cup", "tbsp", "tsp", "oz", "lb", "g", "kg", "ml", "l", "piece", "pieces", "clove", "cloves") or null if no unit
- formattedAmount: A formatted string combining quantity and unit with proper capitalization (e.g., "3 Lbs", "1/2 Cup", "2 Tbsp") or empty string if no quantity/unit

${premiumInstructions}

Examples:
- "2 cups flour" → {name: "flour", quantity: 2, unit: "cup", formattedAmount: "2 Cups"}
- "1 tablespoon olive oil" → {name: "olive oil", quantity: 1, unit: "tbsp", formattedAmount: "1 Tbsp"}
- "3 lbs chopped fresh cilantro" → {name: "cilantro", quantity: 3, unit: "lb", formattedAmount: "3 Lbs"}
- "salt, to taste" → {name: "salt", quantity: null, unit: null, formattedAmount: ""}
- "1/2 cup diced onions" → {name: "onions", quantity: 0.5, unit: "cup", formattedAmount: "1/2 Cup"}

Return a JSON object with this structure:
{
  "parsedIngredients": [
    {
      "name": "ingredient name",
      "quantity": 2.0,
      "unit": "cup",
      "formattedAmount": "2 Cups"
    }
  ]
}

Return only valid JSON.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that parses recipe ingredients. Extract ingredient names, quantities, and units. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: errorText || `OpenAI API error: ${response.status}` 
        })
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    // Extract token usage from OpenAI response
    const usage = data.usage || null;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        parsedIngredients: parsed.parsedIngredients || [],
        usage: usage ? {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0
        } : null,
        userId: userId || null,
        feature: 'ingredient_parsing',
        model: 'gpt-3.5-turbo'
      })
    };
  } catch (error) {
    console.error('Error in AI ingredient parser:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: error.message || 'Internal server error' 
      })
    };
  }
};
