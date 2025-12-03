import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { Recipe } from './models/recipe.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  providers: [GeminiService],
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  ingredients = signal<string[]>(['huevos', 'queso', 'tomates']);
  currentIngredient = signal<string>('');
  
  recipes = signal<Recipe[] | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  mealType = signal<'any' | 'desayuno' | 'comida' | 'cena' | 'merienda'>('any');
  difficulty = signal<'any' | 'fácil' | 'intermedia' | 'difícil'>('any');

  addIngredient(): void {
    const ingredient = this.currentIngredient().trim();
    if (ingredient && !this.ingredients().includes(ingredient.toLowerCase())) {
      this.ingredients.update(list => [...list, ingredient.toLowerCase()]);
    }
    this.currentIngredient.set('');
  }

  removeIngredient(indexToRemove: number): void {
    this.ingredients.update(list => list.filter((_, index) => index !== indexToRemove));
  }
  
  updateCurrentIngredient(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currentIngredient.set(input.value);
  }

  updateMealType(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.mealType.set(select.value as 'any' | 'desayuno' | 'comida' | 'cena' | 'merienda');
  }

  updateDifficulty(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.difficulty.set(select.value as 'any' | 'fácil' | 'intermedia' | 'difícil');
  }
  
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addIngredient();
    }
  }

  async findRecipe(): Promise<void> {
    if (this.ingredients().length === 0) {
      this.error.set('Por favor, añade al menos un ingrediente.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.recipes.set(null);

    try {
      const generatedRecipes = await this.geminiService.generateRecipes(
        this.ingredients(),
        this.mealType(),
        this.difficulty()
      );
      this.recipes.set(generatedRecipes);
    } catch (e) {
      console.error('Error getting recipes:', e);
      this.error.set('No se pudieron generar recetas. Por favor, inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
