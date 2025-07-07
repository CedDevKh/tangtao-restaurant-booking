"use client";

import { useFormState, useFormStatus } from "react-dom";
import { getRecommendationsAction, type RecommendationState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Getting Recommendations...
        </>
      ) : (
        "Find Restaurants"
      )}
    </Button>
  );
}

export default function RecommendationForm() {
  const initialState: RecommendationState = {
    message: null,
    errors: null,
    data: null,
  };

  const [state, dispatch] = useFormState(getRecommendationsAction, initialState);

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Tell us what you like</CardTitle>
          <CardDescription>
            Provide some details and our AI will suggest some great spots.
          </CardDescription>
        </CardHeader>
        <form action={dispatch}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dietaryPreferences">Dietary Preferences</Label>
              <Input
                id="dietaryPreferences"
                name="dietaryPreferences"
                placeholder="e.g., Vegetarian, gluten-free, no seafood"
              />
              {state.errors?.dietaryPreferences && (
                <p className="text-sm font-medium text-destructive">
                  {state.errors.dietaryPreferences[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pastBookingHistory">Past Visits or Favorite Cuisines</Label>
              <Textarea
                id="pastBookingHistory"
                name="pastBookingHistory"
                placeholder="e.g., I loved the atmosphere at The Golden Spoon, enjoy spicy Thai food, and prefer casual dining."
              />
               {state.errors?.pastBookingHistory && (
                <p className="text-sm font-medium text-destructive">
                  {state.errors.pastBookingHistory[0]}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      {state.message && !state.data && (
         <Alert variant="destructive" className="mt-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.data && (
        <div className="mt-8">
            <h2 className="font-headline text-2xl mb-4 text-center">Your Recommendations</h2>
            <Card className="bg-accent/30 border-accent">
                <CardContent className="p-6">
                    <ul className="list-disc list-inside space-y-2">
                        {state.data.recommendations.map((rec, index) => (
                            <li key={index} className="text-lg">{rec}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
