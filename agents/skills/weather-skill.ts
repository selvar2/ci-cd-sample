/**
 * Weather Skill - Fetch weather data from external API
 * Demonstrates: HTTP requests, async operations, caching, error handling
 */

import axios, { AxiosError } from 'axios';

interface WeatherInput {
  city: string;
  units?: 'metric' | 'imperial';
  includeDetails?: boolean;
}

interface WeatherOutput {
  city: string;
  temperature: number;
  condition: string;
  units: string;
  humidity?: number;
  windSpeed?: number;
  timestamp: string;
  cached: boolean;
}

// City coordinates mapping for common cities
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'san francisco': { lat: 37.7749, lon: -122.4194 },
  'new york': { lat: 40.7128, lon: -74.0060 },
  'london': { lat: 51.5074, lon: -0.1278 },
  'paris': { lat: 48.8566, lon: 2.3522 },
  'tokyo': { lat: 35.6762, lon: 139.6503 },
  'sydney': { lat: -33.8688, lon: 151.2093 },
  'berlin': { lat: 52.5200, lon: 13.4050 },
  'mumbai': { lat: 19.0760, lon: 72.8777 },
  'dubai': { lat: 25.2048, lon: 55.2708 },
  'singapore': { lat: 1.3521, lon: 103.8198 },
  'los angeles': { lat: 34.0522, lon: -118.2437 },
  'chicago': { lat: 41.8781, lon: -87.6298 },
  'toronto': { lat: 43.6532, lon: -79.3832 },
  'seattle': { lat: 47.6062, lon: -122.3321 },
  'austin': { lat: 30.2672, lon: -97.7431 },
  'amsterdam': { lat: 52.3676, lon: 4.9041 },
  'madrid': { lat: 40.4168, lon: -3.7038 },
  'rome': { lat: 41.9028, lon: 12.4964 },
  'moscow': { lat: 55.7558, lon: 37.6173 },
  'beijing': { lat: 39.9042, lon: 116.4074 },
  'hong kong': { lat: 22.3193, lon: 114.1694 },
  'bangkok': { lat: 13.7563, lon: 100.5018 },
  'cairo': { lat: 30.0444, lon: 31.2357 },
  'cape town': { lat: -33.9249, lon: 18.4241 },
  'mexico city': { lat: 19.4326, lon: -99.1332 },
  'sao paulo': { lat: -23.5505, lon: -46.6333 },
  'buenos aires': { lat: -34.6037, lon: -58.3816 }
};

// Weather code descriptions from Open-Meteo WMO codes
const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

class WeatherSkill {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry = 3600000;
  private apiTimeout = 15000; // Increased timeout for reliability
  private maxRetries = 2;
  
  static metadata = {
    name: 'weather',
    version: '1.0.0',
    description: 'Retrieves current weather information for a specified city',
    author: 'Agent Team',
    capabilities: ['weather-forecast', 'temperature-check'],
    inputSchema: {
      type: 'object',
      required: ['city'],
      properties: {
        city: {
          type: 'string',
          description: 'City name'
        },
        units: {
          type: 'string',
          enum: ['metric', 'imperial'],
          default: 'metric'
        },
        includeDetails: {
          type: 'boolean',
          default: false
        }
      }
    }
  };

  async execute(input: WeatherInput): Promise<WeatherOutput> {
    try {
      const cacheKey = `${input.city}:${input.units || 'metric'}`;
      
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }

      const weatherData = await this.fetchWeatherData(
        input.city,
        input.units || 'metric',
        input.includeDetails || false
      );

      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return { ...weatherData, cached: false };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async fetchWeatherData(
    city: string,
    units: string,
    detailed: boolean
  ): Promise<WeatherOutput> {
    try {
      // Get coordinates for the city
      const cityLower = city.toLowerCase();
      const coords = CITY_COORDINATES[cityLower];
      
      if (!coords) {
        console.log(`[WeatherSkill] City "${city}" not in database, using geocoding API...`);
        // Try to geocode the city using Open-Meteo's geocoding API
        return await this.fetchWithGeocoding(city, units, detailed);
      }

      const apiUrl = 'https://api.open-meteo.com/v1/forecast';
      
      // Retry logic for API calls
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await axios.get(apiUrl, {
            params: {
              latitude: coords.lat,
              longitude: coords.lon,
              current_weather: true,
              hourly: detailed ? 'relativehumidity_2m' : undefined,
              timezone: 'auto'
            },
            timeout: this.apiTimeout
          });

          if (!response.data || !response.data.current_weather) {
            throw new Error('No data received from weather API');
          }

          const currentWeather = response.data.current_weather;
          let temperature = currentWeather.temperature;
          
          // Convert to Fahrenheit if imperial units requested
          if (units === 'imperial') {
            temperature = (temperature * 9/5) + 32;
          }
          
          // Get humidity from hourly data if available
          let humidity: number | undefined;
          if (detailed && response.data.hourly?.relativehumidity_2m) {
            // Get current hour's humidity
            const currentHourIndex = new Date().getHours();
            humidity = response.data.hourly.relativehumidity_2m[currentHourIndex] || 65;
          }

          const weatherCode = currentWeather.weathercode || 0;
          const condition = WEATHER_CODES[weatherCode] || 'Unknown';
          
          return {
            city,
            temperature: Math.round(temperature),
            condition,
            units: units === 'metric' ? '°C' : '°F',
            ...(detailed && {
              humidity: humidity || 65,
              windSpeed: Math.round(currentWeather.windspeed || 0)
            }),
            timestamp: new Date().toISOString(),
            cached: false
          };
        } catch (err) {
          lastError = err as Error;
          if (attempt < this.maxRetries) {
            console.log(`[WeatherSkill] Attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      throw lastError || new Error('API request failed after retries');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API Error: ${error.response?.status} - ${error.message}`);
      }
      throw error;
    }
  }

  private async fetchWithGeocoding(
    city: string,
    units: string,
    detailed: boolean
  ): Promise<WeatherOutput> {
    // Use Open-Meteo's geocoding API to find city coordinates
    const geocodeUrl = 'https://geocoding-api.open-meteo.com/v1/search';
    const geoResponse = await axios.get(geocodeUrl, {
      params: {
        name: city,
        count: 1,
        language: 'en',
        format: 'json'
      },
      timeout: this.apiTimeout
    });

    if (!geoResponse.data?.results?.[0]) {
      throw new Error(`City not found: ${city}`);
    }

    const location = geoResponse.data.results[0];
    const coords = { lat: location.latitude, lon: location.longitude };

    // Now fetch weather with the found coordinates
    const apiUrl = 'https://api.open-meteo.com/v1/forecast';
    const response = await axios.get(apiUrl, {
      params: {
        latitude: coords.lat,
        longitude: coords.lon,
        current_weather: true,
        hourly: detailed ? 'relativehumidity_2m' : undefined,
        timezone: 'auto'
      },
      timeout: this.apiTimeout
    });

    if (!response.data || !response.data.current_weather) {
      throw new Error('No data received from weather API');
    }

    const currentWeather = response.data.current_weather;
    let temperature = currentWeather.temperature;
    
    if (units === 'imperial') {
      temperature = (temperature * 9/5) + 32;
    }

    let humidity: number | undefined;
    if (detailed && response.data.hourly?.relativehumidity_2m) {
      const currentHourIndex = new Date().getHours();
      humidity = response.data.hourly.relativehumidity_2m[currentHourIndex] || 65;
    }

    const weatherCode = currentWeather.weathercode || 0;
    const condition = WEATHER_CODES[weatherCode] || 'Unknown';
    
    return {
      city: location.name, // Use the official city name from geocoding
      temperature: Math.round(temperature),
      condition,
      units: units === 'metric' ? '°C' : '°F',
      ...(detailed && {
        humidity: humidity || 65,
        windSpeed: Math.round(currentWeather.windspeed || 0)
      }),
      timestamp: new Date().toISOString(),
      cached: false
    };
  }

  private getCachedData(key: string): WeatherOutput | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private handleError(error: any): Error {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WeatherSkill] ${errorMessage}`);
    return new Error(`Weather skill failed: ${errorMessage}`);
  }

  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }
}

export { WeatherSkill, WeatherInput, WeatherOutput };
