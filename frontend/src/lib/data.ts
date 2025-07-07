import type { Restaurant, Booking } from './types';

export const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'The Golden Spoon',
    cuisine: 'Italian',
    rating: 4.8,
    location: '123 Pasta Lane, Rome',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'italian food',
    discounts: [
      { time: '17:30', discount: 20 },
      { time: '21:00', discount: 50 },
    ],
    description: 'Authentic Italian cuisine with a modern twist. Perfect for a romantic dinner or a family celebration.',
    menu: [
      { name: 'Spaghetti Carbonara', price: '$22' },
      { name: 'Margherita Pizza', price: '$18' },
      { name: 'Tiramisu', price: '$12' },
    ],
    reviews: [
      { user: 'Alice', comment: 'Amazing pasta!', rating: 5 },
      { user: 'Bob', comment: 'Great service.', rating: 4 },
    ],
    openingHours: 'Mon-Sun: 12:00 PM - 11:00 PM',
  },
  {
    id: '2',
    name: 'Sushi Palace',
    cuisine: 'Japanese',
    rating: 4.9,
    location: '456 Sakura St, Tokyo',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'sushi platter',
    discounts: [
      { time: '18:00', discount: 15 },
      { time: '20:30', discount: 30 },
    ],
    description: 'The freshest sushi and sashimi in town, prepared by our master chefs.',
     menu: [
      { name: 'Omakase', price: '$150' },
      { name: 'Dragon Roll', price: '$25' },
      { name: 'Miso Soup', price: '$6' },
    ],
    reviews: [
      { user: 'Charlie', comment: 'Best sushi of my life!', rating: 5 },
      { user: 'Diana', comment: 'A bit pricey but worth it.', rating: 4 },
    ],
    openingHours: 'Tue-Sun: 5:00 PM - 10:00 PM',
  },
  {
    id: '3',
    name: 'Le Croissant d\'Or',
    cuisine: 'French',
    rating: 4.7,
    location: '789 Champs-Élysées, Paris',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'french bistro',
    discounts: [
      { time: '19:00', discount: 25 },
      { time: '21:30', discount: 40 },
    ],
    description: 'Experience the taste of Paris with our classic French dishes and exquisite pastries.',
     menu: [
      { name: 'Onion Soup', price: '$15' },
      { name: 'Boeuf Bourguignon', price: '$35' },
      { name: 'Crème Brûlée', price: '$14' },
    ],
    reviews: [
      { user: 'Eve', comment: 'Felt like I was in Paris!', rating: 5 },
      { user: 'Frank', comment: 'The croissants are divine.', rating: 5 },
    ],
    openingHours: 'Mon-Sat: 8:00 AM - 10:00 PM',
  },
  {
    id: '4',
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    rating: 4.5,
    location: '101 Sombrero Ave, Mexico City',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'tacos plate',
    discounts: [
      { time: '17:00', discount: 30 },
      { time: '20:00', discount: 10 },
    ],
    description: 'Vibrant and flavorful Mexican street food. Join us for the best tacos and margaritas!',
     menu: [
      { name: 'Tacos al Pastor', price: '$16' },
      { name: 'Guacamole & Chips', price: '$12' },
      { name: 'Churros', price: '$9' },
    ],
    reviews: [
      { user: 'Grace', comment: 'The atmosphere is so fun!', rating: 5 },
      { user: 'Heidi', comment: 'Margaritas are strong!', rating: 4 },
    ],
    openingHours: 'Mon-Sun: 11:00 AM - 1:00 AM',
  },
];

export const bookings: Booking[] = [
    {
        id: 'b1',
        restaurant: {
            name: 'The Golden Spoon',
            location: '123 Pasta Lane, Rome',
            imageUrl: 'https://placehold.co/600x400.png',
            dataAiHint: 'italian food',
        },
        date: '2024-08-15',
        time: '19:30',
        guests: 2,
        discount: 20,
        status: 'Upcoming',
    },
    {
        id: 'b2',
        restaurant: {
            name: 'Sushi Palace',
            location: '456 Sakura St, Tokyo',
            imageUrl: 'https://placehold.co/600x400.png',
            dataAiHint: 'sushi platter',
        },
        date: '2024-07-20',
        time: '20:00',
        guests: 4,
        discount: 15,
        status: 'Completed',
    },
    {
        id: 'b3',
        restaurant: {
            name: 'Taco Fiesta',
            location: '101 Sombrero Ave, Mexico City',
            imageUrl: 'https://placehold.co/600x400.png',
            dataAiHint: 'tacos plate',
        },
        date: '2024-06-10',
        time: '18:00',
        guests: 3,
        discount: 30,
        status: 'Cancelled',
    },
];
