"use server";

import { getRestaurantRecommendations } from "@/ai/flows/restaurant-recommendation";
import type { RestaurantRecommendationOutput } from "@/ai/flows/restaurant-recommendation";
import { z } from "zod";

const recommendationSchema = z.object({
  dietaryPreferences: z.string().min(1, "Please enter your dietary preferences."),
  pastBookingHistory: z.string().min(1, "Please describe your past bookings or tastes."),
});

export type RecommendationState = {
  message?: string | null;
  errors?: {
    dietaryPreferences?: string[];
    pastBookingHistory?: string[];
  } | null;
  data?: RestaurantRecommendationOutput | null;
};

export async function getRecommendationsAction(
  prevState: RecommendationState,
  formData: FormData
): Promise<RecommendationState> {
  const validatedFields = recommendationSchema.safeParse({
    dietaryPreferences: formData.get("dietaryPreferences"),
    pastBookingHistory: formData.get("pastBookingHistory"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check your inputs.",
      data: null,
    };
  }

  try {
    const result = await getRestaurantRecommendations(validatedFields.data);
    return {
      message: "Here are your recommendations!",
      data: result,
      errors: null,
    };
  } catch (error) {
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: null,
      data: null,
    };
  }
}
