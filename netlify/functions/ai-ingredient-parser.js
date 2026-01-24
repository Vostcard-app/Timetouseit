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
    const { ingredients } = body;

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

    // Build prompt for ingredient parsing
    const prompt = `Parse these recipe ingredients and extract the ingredient name, quantity, and unit separately.

Ingredients to parse:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

For each ingredient, extract:
- name: The ingredient name (e.g., "flour", "olive oil", "chicken breast")
- quantity: The numeric quantity (e.g., 2, 1.5, 0.5) or null if no quantity specified
- unit: The unit of measurement (e.g., "cup", "tbsp", "tsp", "oz", "lb", "g", "kg", "ml", "l", "piece", "pieces", "clove", "cloves") or null if no unit

Examples:
- "2 cups flour" → {name: "flour", quantity: 2, unit: "cup"}
- "1 tablespoon olive oil" → {name: "olive oil", quantity: 1, unit: "tbsp"}
- "salt, to taste" → {name: "salt", quantity: null, unit: null}
- "3 cloves garlic" → {name: "garlic", quantity: 3, unit: "cloves"}
- "1/2 cup milk" → {name: "milk", quantity: 0.5, unit: "cup"}

Return a JSON object with this structure:
{
  "parsedIngredients": [
    {
      "name": "ingredient name",
      "quantity": 2.0,
      "unit": "cup"
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
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        parsedIngredients: parsed.parsedIngredients || []
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
