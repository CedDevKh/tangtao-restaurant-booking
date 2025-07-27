"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  MapPin,
  Search,
  Users,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchBar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locationQuery, setLocationQuery] = useState<string>("");
  const router = useRouter();

  // Example locations for dropdown
  const locations = ["All", "Downtown", "Uptown", "Suburbs", "Waterfront"];
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0]);

  const handleSearch = () => {
    // Combine search query and location for a comprehensive search
    const combinedQuery = [searchQuery, locationQuery, selectedLocation !== "All" ? selectedLocation : ""]
      .filter(Boolean)
      .join(" ");
    
    if (combinedQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(combinedQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl bg-card shadow-lg">
      {/* Mobile: Eatigo-style compact horizontal layout */}
      <div className="sm:hidden">
        <div className="flex items-center gap-2 p-3 bg-card rounded-lg">
          {/* Location dropdown */}
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-24 h-10 text-sm border-none bg-transparent">
              <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Search input - takes remaining space */}
          <Input 
            id="search" 
            placeholder="Search restaurant" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 h-10 border-none bg-muted/30 rounded-md text-sm"
          />
          
          {/* Search button */}
          <Button 
            size="icon" 
            onClick={handleSearch}
            className="h-10 w-10 bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop: Simplified layout without date/time */}
      <div className="hidden sm:block p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="location" className="mb-2 block text-sm font-medium text-muted-foreground">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input 
                id="location" 
                placeholder="City or restaurant name"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10" 
              />
            </div>
          </div>

          <div className="flex-1">
            <label htmlFor="search-desktop" className="mb-2 block text-sm font-medium text-muted-foreground">Restaurant</label>
            <Input 
              id="search-desktop" 
              placeholder="Search restaurant name or cuisine"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="flex items-end">
            <Button 
              size="lg" 
              onClick={handleSearch}
              className="h-10 bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Search className="mr-2 h-5 w-5" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
