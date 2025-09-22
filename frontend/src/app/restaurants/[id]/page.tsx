
import { redirect } from 'next/navigation';

// Server component: perform immediate redirect to unified booking page
export default function RestaurantLegacyRedirect({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { offer?: string };
}) {
  const { id } = params;
  const offer = searchParams?.offer;
  const target = offer ? `/book/${id}?offer=${offer}` : `/book/${id}`;
  redirect(target);
}
