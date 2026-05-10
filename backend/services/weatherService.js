/**
 * Weather Service — OpenWeatherMap API integration
 * TODO: Replace placeholders with live API calls using process.env.WEATHER_API_KEY
 */

const BASE_URL = "https://api.openweathermap.org/data/2.5";

/**
 * Get current weather for a city
 * @param {string} city
 * @param {string} country
 */
export const getCurrentWeather = async (city, country) => {
  // TODO: Uncomment when API key is available
  // const res = await fetch(`${BASE_URL}/weather?q=${city},${country}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
  // const data = await res.json();
  // return formatWeatherData(data);

  return getMockWeather(city);
};

/**
 * Get 7-day forecast
 * @param {string} city
 */
export const getForecast = async (city) => {
  // TODO: Uncomment when API key is available
  // const res = await fetch(`${BASE_URL}/forecast?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric&cnt=40`);
  // const data = await res.json();

  return getMockForecast(city);
};

/**
 * Get best travel months for a destination
 */
export const getBestTravelMonths = (destination) => {
  const TRAVEL_SEASONS = {
    japan: {
      best: ["March", "April", "October", "November"],
      avoid: ["July", "August"],
      notes: "Cherry blossoms (late March–early April) and autumn foliage (late Oct–Nov) are peak seasons",
    },
    bali: {
      best: ["May", "June", "July", "August", "September"],
      avoid: ["January", "February"],
      notes: "Dry season is May–September. Wet season brings heavy rains but fewer crowds",
    },
    iceland: {
      best: ["June", "July", "August"],
      avoid: [],
      notes: "Northern lights: September–March. Midnight sun: June–July",
    },
  };
  const key = destination.toLowerCase().replace(/\s+/g, "_");
  return TRAVEL_SEASONS[key] || {
    best: ["October", "November", "March", "April"],
    avoid: ["July", "August"],
    notes: "Check local seasonal patterns before booking",
  };
};

/**
 * Mock weather data for development/demo
 */
function getMockWeather(city) {
  const weatherMap = {
    tokyo: { temp: 18, feels_like: 16, humidity: 65, condition: "Partly Cloudy", icon: "⛅", wind: 12 },
    kyoto: { temp: 16, feels_like: 14, humidity: 70, condition: "Clear", icon: "☀️", wind: 8 },
    bali: { temp: 29, feels_like: 33, humidity: 82, condition: "Sunny", icon: "🌞", wind: 15 },
    iceland: { temp: 5, feels_like: 1, humidity: 90, condition: "Cloudy", icon: "☁️", wind: 30 },
    paris: { temp: 14, feels_like: 12, humidity: 75, condition: "Overcast", icon: "🌥️", wind: 18 },
  };
  const key = city.toLowerCase();
  const data = weatherMap[key] || { temp: 22, feels_like: 20, humidity: 60, condition: "Clear", icon: "☀️", wind: 10 };
  return { city, ...data, timestamp: new Date().toISOString(), source: "mock" };
}

function getMockForecast(city) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return {
    city,
    forecast: days.map((day, i) => ({
      day,
      high: 18 + Math.floor(Math.random() * 8),
      low: 12 + Math.floor(Math.random() * 5),
      condition: ["Sunny", "Partly Cloudy", "Clear", "Light Rain"][Math.floor(Math.random() * 4)],
      icon: ["☀️", "⛅", "🌤️", "🌦️"][Math.floor(Math.random() * 4)],
      precipitation: Math.floor(Math.random() * 30),
    })),
    source: "mock",
  };
}
