'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Use navigation with renderIcon functions that return inline SVGs
const navigation = [
	{ 
		name: 'Explore', 
		href: '/', 
		renderIcon: (className: string) => (
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
				<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
				<polyline points="9 22 9 12 15 12 15 22"></polyline>
			</svg>
		)
	},
	{ 
		name: 'Restaurants', 
		href: '/restaurants', 
		renderIcon: (className: string) => (
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
				<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
				<path d="M7 2v20"></path>
				<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
			</svg>
		)
	},
	{ 
		name: 'Bookings', 
		href: '/bookings', 
		renderIcon: (className: string) => (
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
				<rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
				<line x1="16" x2="16" y1="2" y2="6"></line>
				<line x1="8" x2="8" y1="2" y2="6"></line>
				<line x1="3" x2="21" y1="10" y2="10"></line>
			</svg>
		)
	},
	{ 
		name: 'Profile', 
		href: '/profile', 
		renderIcon: (className: string) => (
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
				<circle cx="12" cy="8" r="5"></circle>
				<path d="M20 21a8 8 0 1 0-16 0"></path>
			</svg>
		)
	}
];

export default function MobileBottomNav() {
	const pathname = usePathname();
	const [mounted, setMounted] = useState(false);
	
	// Only render on client-side to avoid hydration mismatch with icons
	useEffect(() => {
		setMounted(true);
	}, []);
	
	if (!mounted) {
		return <div className="fixed bottom-0 left-0 right-0 z-[100] border-t bg-background px-2 py-1 h-[68px] sm:hidden"></div>;
	}

	return (
		<div className="fixed bottom-0 left-0 right-0 z-[100] border-t bg-background px-2 py-1 sm:hidden">
			<div className="flex justify-around items-center">
				{navigation.map((item) => {
					// Handle special case for homepage
					const isActive =
						item.href === '/'
							? pathname === '/'
							: pathname?.startsWith(item.href);

					return (
						<Link
							key={item.name}
							href={item.href}
							className={cn(
								'flex flex-col items-center justify-center px-3 py-2 text-xs font-medium transition-colors',
								isActive
									? 'text-primary'
									: 'text-muted-foreground hover:text-foreground'
							)}
						>
							{item.renderIcon(cn(
								'h-5 w-5 mb-1',
								isActive ? 'text-primary' : 'text-muted-foreground'
							))}
							<span
								className={cn(
									'text-xs',
									isActive
										? 'text-primary font-semibold'
										: 'text-muted-foreground'
								)}
							>
								{item.name}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
