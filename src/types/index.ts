export type TravelPersonality =
  | "Backpacker"
  | "Luxury Explorer"
  | "Creator Traveler"
  | "Solo Explorer"
  | "Adventure Seeker"
  | "Romantic Planner"
  | "Spiritual Traveler";

export type TravelMood =
  | "Relax"
  | "Burnout Recovery"
  | "Romantic Escape"
  | "Social Trip"
  | "Adventure Rush"
  | "Nature Detox";

export type TripStatus = "planning" | "upcoming" | "ongoing" | "completed";
export type TripVisibility = "private" | "friends" | "public";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  personality?: TravelPersonality;
  tripsCount: number;
  countriesVisited: number;
  followersCount: number;
  followingCount: number;
  achievements: string[];
  createdAt: string;
}

export interface Trip {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  startDate: string;
  endDate: string;
  budget: number;
  spentAmount: number;
  mood?: TravelMood;
  status: TripStatus;
  visibility: TripVisibility;
  cities: City[];
  collaborators: User[];
  days: ItineraryDay[];
  packingItems: PackingItem[];
  notes: TravelNote[];
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  image?: string;
  description?: string;
  weather?: string;
  temperature?: number;
  costIndex?: number;
  popularityScore?: number;
  crowdLevel?: "low" | "moderate" | "high";
  bestSeason?: string;
  safetyScore?: number;
  coordinates?: { lat: number; lng: number };
}

export interface ItineraryDay {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string;
  city: string;
  activities: Activity[];
  notes?: string;
  budget: number;
  spent: number;
  mood?: string;
}

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  description?: string;
  image?: string;
  rating: number;
  duration: number; // in minutes
  cost: number;
  difficulty?: "easy" | "moderate" | "hard";
  tags: string[];
  location?: string;
  startTime?: string;
  endTime?: string;
  booked?: boolean;
}

export type ActivityCategory =
  | "Adventure"
  | "Food"
  | "Nightlife"
  | "Spiritual"
  | "Nature"
  | "Photography"
  | "Local Experience"
  | "Hidden Gems"
  | "Shopping"
  | "Transport"
  | "Hotel"
  | "Museum"
  | "Beach";

export interface Expense {
  id: string;
  tripId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  currency: string;
}

export interface PackingItem {
  id: string;
  name: string;
  category: "Clothing" | "Electronics" | "Essentials" | "Documents" | "Other";
  packed: boolean;
  quantity?: number;
  notes?: string;
}

export interface TravelNote {
  id: string;
  tripId: string;
  title: string;
  content: string;
  mood?: string;
  images?: string[];
  date: string;
  location?: string;
}

export interface CommunityPost {
  id: string;
  author: User;
  trip?: Trip;
  content: string;
  images?: string[];
  tags: string[];
  likes: number;
  saves: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Vote {
  id: string;
  userId: string;
  itemId: string;
  itemType: "destination" | "activity";
  value: "yes" | "no" | "maybe";
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

export interface WeatherForecast {
  date: string;
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  wind: number;
}

export interface AIRecommendation {
  id: string;
  type: "destination" | "activity" | "tip" | "budget";
  title: string;
  description: string;
  confidence: number;
  tags: string[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  description: string;
  rating: number;
  temperature: number;
  weather: string;
  costIndex: number;
  popularityScore: number;
  crowdLevel: "low" | "moderate" | "high";
  bestSeason: string;
  safetyScore: number;
  trending?: boolean;
  region: string;
  activities: string[];
  tags: string[];
}
