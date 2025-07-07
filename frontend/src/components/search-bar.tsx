"use client";

import { useState } from "react";
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

  return (
    <div className="mx-auto w-full max-w-5xl rounded-lg bg-card p-4 shadow-lg">
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
            <label htmlFor="location" className="mb-2 block text-sm font-medium text-muted-foreground">Location</label>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="location" placeholder="City or restaurant name" className="pl-10" />
            </div>
        </div>
        
        <div>
            <label htmlFor="date" className="mb-2 block text-sm font-medium text-muted-foreground">Date</label>
            <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={"outline"}
                className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                />
            </PopoverContent>
            </Popover>
        </div>

        <div>
            <label htmlFor="time" className="mb-2 block text-sm font-medium text-muted-foreground">Time</label>
             <Select defaultValue="1900">
                <SelectTrigger>
                     <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1800">6:00 PM</SelectItem>
                    <SelectItem value="1830">6:30 PM</SelectItem>
                    <SelectItem value="1900">7:00 PM</SelectItem>
                    <SelectItem value="1930">7:30 PM</SelectItem>
                    <SelectItem value="2000">8:00 PM</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <Button size="lg" className="w-full lg:col-start-5">
          <Search className="mr-2 h-5 w-5" />
          Search
        </Button>
      </div>
    </div>
  );
}
