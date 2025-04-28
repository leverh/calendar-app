import { useState, useEffect } from "react";

function WeatherWidget({ location = "New York,US" }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Access API key from environment variables
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  
  useEffect(() => {
    // No attempt to fetch if API key is missing
    if (!API_KEY) {
      console.error("Weather API key is missing");
      setError("Weather API key is missing");
      setLoading(false);
      return;
    }
    
    const fetchWeather = async () => {
      try {
        setLoading(true);
        console.log(`Fetching weather for ${location} with key ${API_KEY.substring(0, 3)}...`);
        
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=imperial&appid=${API_KEY}`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Weather API error:", errorData);
          throw new Error(`Weather API error: ${errorData.message || "Unknown error"}`);
        }
        
        const data = await response.json();
        console.log("Weather data received:", data);
        setWeather(data);
        setLoading(false);
      } catch (err) {
        console.error("Weather fetch error:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchWeather();
    
    // Refresh every 3 hours
    const interval = setInterval(fetchWeather, 3 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location, API_KEY]);
  
  if (loading) return <div className="weather-widget">Loading weather...</div>;
  if (error) return <div className="weather-widget weather-error">Unable to load weather: {error}</div>;
  if (!weather) return null;
  
  const temp = Math.round(weather.main.temp);
  const description = weather.weather[0].description;
  const icon = weather.weather[0].icon;
  
  return (
    <div className="weather-widget">
      <div className="weather-current">
        <img 
          src={`https://openweathermap.org/img/wn/${icon}@2x.png`} 
          alt={description}
          className="weather-icon" 
        />
        <div className="weather-info">
          <div className="weather-temp">{temp}°F</div>
          <div className="weather-desc">{description}</div>
          <div className="weather-location">{weather.name}</div>
        </div>
      </div>
    </div>
  );
}

export default WeatherWidget;