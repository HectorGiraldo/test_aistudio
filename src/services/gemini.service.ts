import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { Recipe } from '../models/recipe.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // This is a placeholder for the API key. In a real applet environment,
    // process.env.API_KEY would be provided.
    const apiKey = (window as any).process?.env?.API_KEY ?? '';
    if (!apiKey) {
      console.warn("API Key not found. Please set process.env.API_KEY.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateRecipes(ingredients: string[], mealType: string, difficulty: string): Promise<Recipe[]> {
    let prompt = `Eres un chef creativo y experto en cocina casera. Basándote exclusivamente en la siguiente lista de ingredientes, crea 3 recetas deliciosas.`;

    if (mealType !== 'any') {
      prompt += ` Las recetas deben ser adecuadas para el ${mealType}.`;
    }
    
    if (difficulty !== 'any') {
      prompt += ` La dificultad de las recetas debe ser ${difficulty}.`;
    }

    prompt += `\nIngredientes disponibles: ${ingredients.join(', ')}.
    
    Tu respuesta DEBE ser un array de objetos JSON, donde cada objeto tiene la estructura especificada. No incluyas ingredientes que no estén en la lista. Si faltan ingredientes esenciales, crea las mejores recetas posibles con lo que hay. Ofrece variedad en las recetas si es posible.`;

    const recipeSchema = {
      type: Type.OBJECT,
      properties: {
        recipeName: {
          type: Type.STRING,
          description: 'El nombre creativo de la receta.'
        },
        description: {
          type: Type.STRING,
          description: 'Una breve y apetitosa descripción del plato (2-3 frases).'
        },
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: 'Lista de ingredientes necesarios para la receta con sus cantidades. Solo puedes usar los ingredientes proporcionados.'
        },
        instructions: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: 'Pasos numerados y claros para preparar la receta.'
        },
        mealType: {
            type: Type.STRING,
            description: `El tipo de comida (ej: 'Desayuno', 'Comida', 'Cena', 'Merienda'). Debe coincidir con la solicitud del usuario si se especifica.`
        },
        difficulty: {
            type: Type.STRING,
            description: `El nivel de dificultad (ej: 'Fácil', 'Intermedia', 'Difícil'). Debe coincidir con la solicitud del usuario si se especifica.`
        }
      },
      required: ['recipeName', 'description', 'ingredients', 'instructions', 'mealType', 'difficulty']
    };

    const recipesArraySchema = {
      type: Type.ARRAY,
      items: recipeSchema
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: recipesArraySchema,
          temperature: 0.7,
        }
      });
      
      const jsonText = response.text.trim();
      const recipeData = JSON.parse(jsonText);

      return recipeData as Recipe[];
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to generate recipes from API.');
    }
  }
}
