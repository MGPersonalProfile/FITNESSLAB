import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const AnalysisSchema = z.object({
  nombre: z.string().describe('Concise food name in Spanish, e.g. "Pollo a la plancha con arroz"'),
  calorias: z.number().int().describe('Total calories (kcal) for the visible portion'),
  proteinas: z.number().int().describe('Protein grams for the visible portion'),
  grasas: z.number().int().describe('Fat grams for the visible portion'),
  carbohidratos: z.number().int().describe('Carb grams for the visible portion'),
  fibra: z.number().int().describe('Fiber grams for the visible portion'),
  azucar: z.number().int().describe('Sugar grams for the visible portion'),
  tipo_comida: z
    .enum(['Desayuno', 'Almuerzo', 'Cena', 'Snack'])
    .describe('Best guess of the meal slot based on the food shown'),
});

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      system:
        'Eres un nutricionista experto. Analiza la foto de comida y devuelve macros precisos para la porción visible. ' +
        'Sé conservador: si dudas entre dos valores, elige el más probable, no el más alto. ' +
        'El nombre debe ser corto y descriptivo en español. ' +
        'Adivina "tipo_comida" según qué se está comiendo (Desayuno/Almuerzo/Cena/Snack).',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analiza esta comida y devuelve los macros estimados.' },
            { type: 'image', image },
          ],
        },
      ],
      schema: AnalysisSchema,
    });

    return Response.json(object);
  } catch (error) {
    console.error('Analyze API error:', error);
    return Response.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
