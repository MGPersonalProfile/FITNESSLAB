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
      system: 'You are an enthusiastic, hardcore gym coach and expert nutritionist. Your task is to accurately evaluate a photo of a meal and estimate its nutritional content. Cross-reference your knowledge to provide highly accurate macros, including fiber and sugar. Guess the "tipo_comida" (Desayuno, Almuerzo, Cena, Snack) based on the food type. Provide an enthusiastic, motivational "comentario_coach" pushing the user to their limits. Always respond with the best possible estimates.',
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
        fibra: z.number(),
        azucar: z.number(),
        tipo_comida: z.enum(['Desayuno', 'Almuerzo', 'Cena', 'Snack']),
        calidad_nutricional: z.number().min(1).max(10),
        comentario_coach: z.string(),
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
