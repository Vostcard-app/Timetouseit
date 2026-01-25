/**
 * Netlify Function: AI Category Detector
 * Uses OpenAI to categorize food items into: Proteins, Vegetables, Fruits, Dairy, Leftovers, Other
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
    const { itemName, userId } = body;

    if (!itemName || typeof itemName !== 'string' || !itemName.trim()) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Item name is required' })
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

    const prompt = `Classify this food item into exactly one of these categories: Proteins, Vegetables, Fruits, Dairy, Leftovers, Other.

Food item: "${itemName.trim()}"

Categories:
- Proteins: Meat, poultry, fish, seafood, eggs, tofu, beans, lentils, nuts, seeds
- Vegetables: Any vegetable, including leafy greens, root vegetables, cruciferous vegetables, etc.
- Fruits: Any fruit, fresh or dried
- Dairy: Milk, cheese, yogurt, butter, cream, and dairy alternatives
- Leftovers: Previously prepared food that is being stored
- Other: Anything that doesn't fit the above categories (spices, condiments, beverages, etc.)

Return a JSON object with this structure:
{
  "category": "CategoryName"
}

Return only valid JSON.`;

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
            content: 'You are a helpful assistant that categorizes food items. Return only valid JSON with a category field.'
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
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No response from OpenAI' })
      };
    }

    const parsed = JSON.parse(content);
    const category = parsed.category;

    // Validate category is one of the allowed values
    const validCategories = ['Proteins', 'Vegetables', 'Fruits', 'Dairy', 'Leftovers', 'Other'];
    if (!validCategories.includes(category)) {
      console.warn(`Invalid category returned: ${category}, defaulting to Other`);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ category: 'Other' })
      };
    }

    // Extract token usage from OpenAI response
    const usage = data.usage || null;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        category,
        usage: usage ? {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0
        } : null,
        userId: userId || null,
        feature: 'category_detection',
        model: 'gpt-3.5-turbo'
      })
    };
  } catch (error) {
    console.error('Error in AI category detector:', error);
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
