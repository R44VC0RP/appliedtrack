import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { Logger } from '@/lib/logger';

export const maxDuration = 30;

/**
 * POST handler for the chat API endpoint
 * Processes incoming chat messages and returns a streamed response using OpenAI's GPT-4
 * 
 * @param req - The incoming request object containing chat messages
 * @returns StreamingResponse containing the AI's response
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    await Logger.info('Processing chat request', {
      messageCount: messages.length,
      firstMessageContent: messages[0]?.content?.slice(0, 100), // First 100 chars for context
    });

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages,
      tools: {
        /**
         * Mock weather tool that returns a random temperature for a given location
         */
        weather: tool({
          description: 'Get the weather in a location (farenheit)',
          parameters: z.object({
            location: z.string().describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            await Logger.info('Weather tool called', { location, temperature });
            return { location, temperature };
          },
        }),

        /**
         * Utility tool to convert Fahrenheit to Celsius
         */
        convertFarenheitToCelsius: tool({
          description: 'Convert a temperature in farenheit to celsius',
          parameters: z.object({
            temperature: z
              .number()
              .describe('The temperature in farenheit to convert'),
          }),
          execute: async ({ temperature }) => {
            const celsius = Math.round((temperature - 32) * (5 / 9));
            await Logger.info('Temperature conversion performed', {
              fahrenheit: temperature,
              celsius,
            });
            return { celsius };
          },
        }),
      },
    });

    await Logger.info('Chat response generated successfully', {
      messageCount: messages.length,
      firstMessageContent: messages[0]?.content?.slice(0, 100),
    });
    return result.toDataStreamResponse();
  } catch (error) {
    await Logger.error('Chat API Error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: '/api/chat',
      method: 'POST',
    });
    
    return new Response('Error processing chat request', { status: 500 });
  }
}