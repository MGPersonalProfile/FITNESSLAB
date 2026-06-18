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
  plato: z
    .object({
      verduras_frutas_pct: z
        .number()
        .int()
        .min(0)
        .max(100)
        .describe('Approx % of the plate AREA taken by vegetables and fruits'),
      cereales_pct: z
        .number()
        .int()
        .min(0)
        .max(100)
        .describe('Approx % of the plate AREA taken by grains/cereals/starches (rice, bread, pasta, potato, tortilla)'),
      proteina_pct: z
        .number()
        .int()
        .min(0)
        .max(100)
        .describe('Approx % of the plate AREA taken by protein (meat, fish, eggs, legumes, dairy)'),
      otros_pct: z
        .number()
        .int()
        .min(0)
        .max(100)
        .describe('Approx % of the plate AREA taken by anything else: fried foods, heavy sauces, sweets, sugary drinks'),
      detectado: z
        .array(z.string())
        .describe('Short list of the main components seen on the plate, in Spanish'),
      recomendacion: z
        .string()
        .describe('One short, actionable tip in Spanish to make the plate closer to the Harvard Healthy Eating Plate'),
    })
    .describe(
      'Visual breakdown of the plate vs the Harvard Healthy Eating Plate (½ vegetables & fruits, ¼ whole grains, ¼ protein). ' +
        'Estimate proportions by the AREA each group occupies on the plate, not by calories. The four percentages should add up to roughly 100.',
    ),
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
        'Adivina "tipo_comida" según qué se está comiendo (Desayuno/Almuerzo/Cena/Snack). ' +
        'Además evalúa el platillo contra el Plato de Harvard (½ verduras y frutas, ¼ cereales integrales, ¼ proteína): ' +
        'estima qué proporción del ÁREA del plato ocupa cada grupo (verduras/frutas, cereales, proteína y "otros" como fritos/salsas/dulces/bebidas azucaradas), ' +
        'lista los componentes detectados y da una recomendación corta y accionable en español. Las proporciones deben sumar ~100.',
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
