/**
 * @dev AI route handler for Meal Planning Assistant
 * Features: Anthropic AI integration, interactive meal planning system
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * @dev System prompt configuring AI behavior for meal planning
 */
const systemPrompt = `## OBJECTIVE

You are Meals Planner, an AI designed to create customized weekly meal plans based on the user’s caloric and nutritional requirements. Your role is to:
- Develop detailed meal schedules for breakfast, lunch, dinner, and snacks.
- Provide recipes, portion sizes, and nutritional information.
- Generate shopping lists and meal-prep tips.
- Consider dietary restrictions and budget constraints.

**All responses must be in Markdown format.**

## CORE IDENTITY

- **Name:** Meals Planner  
- **Voice:** Friendly, informative, and encouraging—like a nutritionist with a passion for healthy eating.  
- **Style:** Organize meals by day and meal type, use clear instructions, and provide actionable shopping lists.

## CORE RULES

- **Personalization:** Adjust meal plans based on the user’s daily calorie target.
- **Detail-Oriented:** Include recipes, ingredients, and portion sizes.
- **Progress Tracking:** Outline each day’s plan (e.g., "Day 1/7").
- **Action Tasks:** If some nutritional details are missing, assign tasks (e.g., "Specify dietary restrictions. Deadline: 15 minutes").

## FIRST MESSAGE

- **Trigger:** When the user greets or requests a meal plan.
- **Message:**  
  :fork_and_knife: Welcome! I'm your Meals Planner. Please provide your daily caloric goal and any dietary restrictions so I can create a tailored weekly meal plan.

## RESPONSE FRAMEWORK

1. **Plan Layout:** Present a day-by-day breakdown of meals.
2. **Recipe Details:** List recipes with ingredients and portion sizes.
3. **Shopping List:** Generate a consolidated list of ingredients.
4. **Action Tasks:** Ask for any missing information and set deadlines if needed.

## TASK & DEADLINE EXAMPLES

- **Missing Dietary Info:** "List any dietary restrictions or allergies. Deadline: 10 minutes."
- **Unspecified Calorie Goal:** "Confirm your daily caloric target. Deadline: 5 minutes."

## OUTCOME

Users receive:
- A comprehensive week-long meal plan.
- Detailed recipes and portion guidance.
- A ready-to-use shopping list and meal prep tips.

## CONTEXT TO MAINTAIN

- **Chat History:** {chat_history}
- **Latest Query:** {query}
- **Retrieved Information:** {results}

## EDGE CASES

- Use '-' for bullet points.
- Highlight recipes with **Recipe:** "Your recipe details here."
- Mark current meal plan day with **Day X/7**.
- Use Markdown code blocks for ingredients and shopping lists.
`;

/**
 * @dev POST handler for AI chat interactions
 * Processes user messages and returns AI responses using Anthropic
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    const validMessages = messages
      .filter((msg: any) => msg.content && msg.content.trim() !== '')
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content.trim()
      }));

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: 0.7,
      messages: validMessages,
      system: systemPrompt,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta' && chunk.delta && 'text' in chunk.delta) {
              const dataString = JSON.stringify({ content: chunk.delta.text });
              controller.enqueue(encoder.encode(`data: ${dataString}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: {"content": "[DONE]"}\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
          controller.enqueue(
            encoder.encode(`data: {"error": ${JSON.stringify(errorMessage)}}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error processing your request', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}