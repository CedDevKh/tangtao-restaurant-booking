export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  location: string;
  imageUrl: string;
  dataAiHint: string;
  discounts: { time: string; discount: number }[];
  description: string;
  menu: { name: string; price: string }[];
  reviews: { user: string; comment: string; rating: number }[];
  openingHours: string;
};

export type Booking = {
  id: string;
  restaurant: Pick<Restaurant, 'name' | 'location' | 'imageUrl' | 'dataAiHint'>;
  date: string;
  time: string;
  guests: number;
  discount: number;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
};
