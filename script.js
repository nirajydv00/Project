// Add your WeatherAPI key here. Get a free key at https://www.weatherapi.com/
// Keep this key private if you publish the site: browser code cannot hide API keys.
const API_KEY = "YOUR_API_KEY";
const API_BASE = "https://api.weatherapi.com/v1";

const form = document.querySelector("#search-form");
const input = document.querySelector("#location-input");
const searchButton = form.querySelector("button");
const statusBox = document.querySelector("#status");
const weatherSection = document.querySelector("#weather");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const location = input.value.trim();
  if (!location) {
    input.focus();
    return;
  }
  if (API_KEY === "YOUR_API_KEY") {
    showStatus("Add your WeatherAPI key to the API_KEY setting at the top of script.js, then search again.", "error");
    return;
  }

  // The forecast endpoint includes both current conditions and today's forecast.
  await loadWeather(location);
});

async function loadWeather(location) {
  setLoading(true);
  showStatus(`Finding the weather for ${location}…`, "loading");
  weatherSection.hidden = true;

  try {
    const url = new URL(`${API_BASE}/forecast.json`);
    url.search = new URLSearchParams({ key: API_KEY, q: location, days: "1", aqi: "yes", alerts: "no" });
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "We couldn’t find that location. Try another city name.");
    }

    renderWeather(data);
    statusBox.hidden = true;
    weatherSection.hidden = false;
  } catch (error) {
    showStatus(error.message || "Something went wrong while fetching the weather. Please try again.", "error");
  } finally {
    setLoading(false);
  }
}

function renderWeather(data) {
  const { location, current, forecast } = data;
  const today = forecast.forecastday[0];
  const iconUrl = `https:${current.condition.icon}`;

  setText("#place-name", location.name);
  setText("#country-code", location.country);
  setText("#local-time", formatLocalDateTime(location.localtime));
  setText("#time-short", formatLocalTime(location.localtime));
  setText("#temperature", Math.round(current.temp_c));
  setText("#condition", current.condition.text);
  setText("#feels-like", `${Math.round(current.feelslike_c)}°C`);
  setText("#humidity", `${current.humidity}%`);
  setText("#wind", `${current.wind_kph} km/h`);
  setText("#uv", current.uv);
  setText("#today-high", `${Math.round(today.day.maxtemp_c)}°`);
  setText("#today-low", `${Math.round(today.day.mintemp_c)}°`);
  setText("#forecast-high", `${Math.round(today.day.maxtemp_c)}°`);
  setText("#forecast-low", `${Math.round(today.day.mintemp_c)}°`);
  setText("#forecast-day", new Intl.DateTimeFormat(undefined, { weekday: "long", timeZone: "UTC" }).format(new Date(`${today.date}T12:00:00Z`)));

  const icon = document.querySelector("#weather-icon");
  icon.src = iconUrl;
  icon.alt = current.condition.text;
  renderHourlyForecast(today.hour, location.localtime);
}

function renderHourlyForecast(hours, localtime) {
  const list = document.querySelector("#hourly-list");
  list.replaceChildren();
  // Show the next 8 hours, starting from the current local hour.
  const currentHour = Number(localtime.slice(11, 13));
  const upcoming = hours.slice(currentHour, currentHour + 8);

  upcoming.forEach((hour, index) => {
    const item = document.createElement("div");
    item.className = "hour";
    const label = index === 0 ? "Now" : formatHour(hour.time);
    const icon = document.createElement("img");
    icon.src = `https:${hour.condition.icon}`;
    icon.alt = hour.condition.text;
    icon.loading = "lazy";

    const time = document.createElement("div");
    time.className = "hour-time";
    time.textContent = label;
    const temperature = document.createElement("div");
    temperature.className = "hour-temp";
    temperature.textContent = `${Math.round(hour.temp_c)}°`;
    const condition = document.createElement("div");
    condition.className = "hour-condition";
    condition.textContent = hour.condition.text;
    item.append(time, icon, temperature, condition);
    list.append(item);
  });
}

function formatLocalDateTime(dateTime) {
  const [date, time] = dateTime.split(" ");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  return `${dateLabel} · ${formatHourValue(hour, minute)}`;
}

function formatLocalTime(dateTime) {
  const [, time] = dateTime.split(" ");
  const [hour, minute] = time.split(":").map(Number);
  return formatHourValue(hour, minute);
}

function formatHour(time) {
  const hour = Number(time.slice(11, 13));
  return formatHourValue(hour, 0);
}

function formatHourValue(hour, minute) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

function showStatus(message, type = "") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
  statusBox.hidden = false;
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.querySelector("span:first-child").textContent = isLoading ? "Loading" : "Search";
  searchButton.setAttribute("aria-busy", String(isLoading));
}
