// src/ai/flows/restaurant-recommendation.ts
'use server';
/**
 * @fileOverview Personalized restaurant recommendations based on user preferences.
 *
 * - getRestaurantRecommendations - A function that returns personalized restaurant recommendations.
 * - RestaurantRecommendationInput - The input type for the getRestaurantRecommendations function.
 * - RestaurantRecommendationOutput - The return type for the getRestaurantRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RestaurantRecommendationInputSchema = z.object({
  dietaryPreferences: z
    .string() // Consider making this an enum or a more structured object
    .describe('The dietary preferences of the user (e.g., vegetarian, vegan, gluten-free).'),
  pastBookingHistory: z
    .string() // Consider making this an array of booking objects with relevant details
    .describe('A summary of the user\'s past restaurant bookings.'),
});
export type RestaurantRecommendationInput = z.infer<
  typeof RestaurantRecommendationInputSchema
>;

const RestaurantRecommendationOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('A list of restaurant recommendations based on the user\'s preferences.'),
});
export type RestaurantRecommendationOutput = z.infer<
  typeof RestaurantRecommendationOutputSchema
>;

export async function getRestaurantRecommendations(
  input: RestaurantRecommendationInput
): Promise<RestaurantRecommendationOutput> {
  return restaurantRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'restaurantRecommendationPrompt',
  input: {schema: RestaurantRecommendationInputSchema},
  output: {schema: RestaurantRecommendationOutputSchema},
  prompt: `You are a restaurant recommendation expert. Based on the user's dietary preferences and past booking history, you will provide a list of restaurant recommendations.

Dietary Preferences: {{{dietaryPreferences}}}
Past Booking History: {{{pastBookingHistory}}}

Recommendations:
`, // Ensure the output format is suitable for the schema
});

const restaurantRecommendationFlow = ai.defineFlow(
  {
    name: 'restaurantRecommendationFlow',
    inputSchema: RestaurantRecommendationInputSchema,
    outputSchema: RestaurantRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
