'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Icon helpers (inline SVG keeps bundle small + no external deps)
const icons = {
	home: (c: string) => (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}>
			<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
			<polyline points="9 22 9 12 15 12 15 22"></polyline>
		</svg>
	),
	map: (c: string) => (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}>
			<path d="M21 10c0 5-9 12-9 12s-9-7-9-12a9 9 0 1 1 18 0Z" />
			<circle cx="12" cy="10" r="3" />
		</svg>
	),
	restaurants: (c: string) => (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}>
			<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
			<path d="M7 2v20"></path>
			<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
		</svg>
	),
	bookings: (c: string) => (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}>
			<rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
			<line x1="16" x2="16" y1="2" y2="6"></line>
			<line x1="8" x2="8" y1="2" y2="6"></line>
			<line x1="3" x2="21" y1="10" y2="10"></line>
		</svg>
	),
	profile: (c: string) => (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}>
			<circle cx="12" cy="8" r="5"></circle>
			<path d="M20 21a8 8 0 1 0-16 0"></path>
		</svg>
	),
	admin: (c: string) => (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}>
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6c.26 0 .51-.05.74-.15A1.65 1.65 0 0 0 11 3.09V3a2 2 0 1 1 4 0v.09c0 .69.4 1.31 1.02 1.61.23.1.48.15.74.15.69 0 1.31-.4 1.61-1.02l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.69 0 1.31.4 1.61 1.02.1.23.15.48.15.74s-.05.51-.15.74A1.65 1.65 0 0 0 19.4 15Z" />
		</svg>
	),
};

export default function MobileBottomNav() {
	const pathname = usePathname();
	const [mounted, setMounted] = useState(false);
	const { user } = useAuth();

	useEffect(() => { setMounted(true); }, []);

	// Build navigation dynamically so we can inject Admin for staff/dev users
	const navigation = useMemo(() => {
		const base = [
			{ name: 'Explore', href: '/', icon: icons.home },
			{ name: 'Map', href: '/map', icon: icons.map },
			{ name: 'Restaurants', href: '/restaurants', icon: icons.restaurants },
			{ name: 'Bookings', href: '/bookings', icon: icons.bookings },
		];
		const tail = [ { name: 'Profile', href: '/profile', icon: icons.profile } ];
		const showAdmin = user?.is_staff; // treat staff as dev/admin
		return showAdmin
			? [...base, { name: 'Admin', href: '/admin/dashboard', icon: icons.admin }, ...tail]
			: [...base, ...tail];
	}, [user]);

	if (!mounted) {
		return <div className="fixed bottom-0 left-0 right-0 z-[100] border-t bg-background px-2 py-1 h-[68px] sm:hidden" />;
	}

	return (
		<div className="fixed bottom-0 left-0 right-0 z-[100] border-t bg-background px-2 py-1 sm:hidden">
			<div className="flex justify-around items-center">
				{navigation.map(item => {
					const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
					return (
						<Link
							key={item.name}
							href={item.href}
							className={cn(
								'flex flex-col items-center justify-center px-3 py-2 text-xs font-medium transition-colors',
								isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
							)}
						>
							{item.icon(cn('h-5 w-5 mb-1', isActive ? 'text-primary' : 'text-muted-foreground'))}
							<span className={cn('text-xs', isActive ? 'text-primary font-semibold' : 'text-muted-foreground')}>
								{item.name}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
