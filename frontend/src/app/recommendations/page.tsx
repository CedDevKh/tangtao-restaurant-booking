import RecommendationForm from "./recommendation-form";

export default function RecommendationsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold">AI Restaurant Picks</h1>
        <p className="mt-2 text-muted-foreground">
          Let our AI find the perfect restaurant for you based on your tastes.
        </p>
      </div>
      <RecommendationForm />
    </div>
  );
}
