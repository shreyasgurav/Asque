import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if the current environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Convert bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Convert URLs in text to clickable links
export const convertUrlsToLinks = (text: string): string => {
  if (!text) return text;
  
  // Function to clean URLs by removing trailing punctuation
  const cleanUrl = (url: string): string => {
    return url.replace(/[\)\]\}.,!?;:]$/, '');
  };
  
  // First, handle markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let processedText = text.replace(markdownLinkRegex, (match, linkText, url) => {
    const cleanUrlText = cleanUrl(url);
    return `<a href="${cleanUrlText}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">${linkText}</a>`;
  });
  
  // Then handle plain URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return processedText.replace(urlRegex, (url) => {
    // Clean the URL and ensure it's properly formatted
    const cleanUrlText = cleanUrl(url.trim());
    return `<a href="${cleanUrlText}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">${cleanUrlText}</a>`;
  });
};

// Time and location utilities for bot context awareness
export interface UserContext {
  location: {
    city: string;
    country: string;
    timezone: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  time: {
    currentTime: Date;
    localTime: Date;
    timezone: string;
    isDaytime: boolean;
    mealTime?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    dayOfWeek: string;
  };
}

// Get user's location and time context
export async function getUserContext(): Promise<UserContext | null> {
  try {
    // Get current time in user's timezone
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Get location using browser geolocation (optional)
    let position: GeolocationPosition | null = null;
    try {
      position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Use low accuracy to avoid permission issues
          timeout: 5000, // Shorter timeout
          maximumAge: 300000 // 5 minutes cache
        });
      });
    } catch (geoError) {
      console.log('Geolocation failed, using fallback:', geoError);
      // Continue without geolocation
    }

    let locationData: any = null;
    
    if (position) {
      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding to get city and country
      try {
        const locationResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        
        if (locationResponse.ok) {
          locationData = await locationResponse.json();
        }
      } catch (locationError) {
        console.log('Reverse geocoding failed:', locationError);
      }
    }
    
    // Determine if it's daytime (6 AM to 6 PM)
    const hour = now.getHours();
    const isDaytime = hour >= 6 && hour < 18;
    
    // Determine meal time based on local time
    let mealTime: 'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined;
    if (hour >= 6 && hour < 11) {
      mealTime = 'breakfast';
    } else if (hour >= 11 && hour < 16) {
      mealTime = 'lunch';
    } else if (hour >= 16 && hour < 22) {
      mealTime = 'dinner';
    } else {
      mealTime = 'snack';
    }
    
    // Get day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[now.getDay()];
    
    return {
      location: {
        city: locationData?.city || locationData?.locality || 'Unknown City',
        country: locationData?.countryName || 'Unknown Country',
        timezone,
        coordinates: position ? {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        } : undefined
      },
      time: {
        currentTime: now,
        localTime: now, // In user's timezone
        timezone,
        isDaytime,
        mealTime,
        dayOfWeek
      }
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    // Return basic context without location
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hour = now.getHours();
    const isDaytime = hour >= 6 && hour < 18;
    
    let mealTime: 'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined;
    if (hour >= 6 && hour < 11) {
      mealTime = 'breakfast';
    } else if (hour >= 11 && hour < 16) {
      mealTime = 'lunch';
    } else if (hour >= 16 && hour < 22) {
      mealTime = 'dinner';
    } else {
      mealTime = 'snack';
    }
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[now.getDay()];
    
    return {
      location: {
        city: 'Unknown City',
        country: 'Unknown Country',
        timezone,
        coordinates: undefined
      },
      time: {
        currentTime: now,
        localTime: now,
        timezone,
        isDaytime,
        mealTime,
        dayOfWeek
      }
    };
  }
}

// Format time for display
export function formatTime(date: Date, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone
  }).format(date);
}

// Format date for display with timezone
export function formatDateWithTimezone(date: Date, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone
  }).format(date);
}

// Check if current time matches a schedule
export function isTimeInRange(
  currentTime: Date,
  startTime: string, // Format: "HH:MM"
  endTime: string,   // Format: "HH:MM"
  timezone?: string
): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMinutes = currentHour * 60 + currentMinute;
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// Get meal time description
export function getMealTimeDescription(mealTime: string, isDaytime: boolean): string {
  switch (mealTime) {
    case 'breakfast':
      return 'breakfast time';
    case 'lunch':
      return 'lunch time';
    case 'dinner':
      return 'dinner time';
    case 'snack':
      return isDaytime ? 'afternoon snack time' : 'late night snack time';
    default:
      return 'meal time';
  }
}

 