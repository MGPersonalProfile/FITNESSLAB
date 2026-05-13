import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      system: 'You are an expert nutritionist. Your task is to accurately evaluate a photo of a meal and estimate its nutritional content. Always respond with the best possible estimates.',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Evaluate this meal and estimate its macros and calories.' },
            { type: 'image', image: image },
          ],
        },
      ],
      schema: z.object({
        nombre: z.string(),
        calorias: z.number(),
        proteinas: z.number(),
        grasas: z.number(),
        carbohidratos: z.number(),
      }),
    });

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
