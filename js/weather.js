// script.js

// API 키
const API_KEY = "2b449509f9759ce1f3b01e6df45af171";
const API_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

// DOM 요소
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const toggleBtn = document.getElementById("toggleBtn");
const searchPanel = document.getElementById("searchPanel");
const refreshBtn = document.getElementById("refreshBtn");
const backgroundVideo = document.getElementById("backgroundVideo");

// 날씨 정보 표시 요소
const currentDate = document.getElementById("currentDate");
const temperature = document.getElementById("temperature");
const cityName = document.getElementById("cityName");
const weatherIcon = document.getElementById("weatherIcon");
const tempRange = document.getElementById("tempRange");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const cloudy = document.getElementById("cloudy");
const weatherMessage = document.getElementById("weatherMessage"); // weatherSuggestion이 아니라 weatherMessage!
const weeklyForecast = document.getElementById("weeklyForecast");

// 추가된 요소들
const feelsLike = document.getElementById("feelsLike");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
// 초기화
init();

function init() {
  updateDate();
  getWeatherByCity("Seoul");

  // 모바일에서는 패널을 보이게 시작 (hidden 클래스 제거)
  if (window.innerWidth <= 768) {
    searchPanel.classList.remove("hidden");
  }

  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
  toggleBtn.addEventListener("click", togglePanel);
  refreshBtn.addEventListener("click", () => {
    const city = cityName.textContent;
    getWeatherByCity(city);
  });
}

function updateDate() {
  const now = new Date();
  const day = now.getDate();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });

  const dayWithSuffix = day + getDaySuffix(day);
  currentDate.textContent = `${weekday}, ${dayWithSuffix} ${month} ${year}`;
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function handleSearch() {
  const city = searchInput.value.trim();
  if (city) {
    getWeatherByCity(city);
    searchInput.value = "";
  }
}

async function getWeatherByCity(city) {
  try {
    // 현재 날씨 가져오기
    const response = await fetch(
      `${API_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=kr`
    );

    if (!response.ok) {
      throw new Error("도시를 찾을 수 없습니다.");
    }

    const data = await response.json();
    updateWeatherUI(data);

    // 주간 날씨 가져오기
    getWeeklyForecast(city);
  } catch (error) {
    alert(error.message);
    console.error("Error:", error);
  }
}

// 주간 날씨 가져오기
async function getWeeklyForecast(city) {
  try {
    const response = await fetch(
      `${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=kr`
    );

    if (!response.ok) {
      throw new Error("예보 정보를 가져올 수 없습니다.");
    }

    const data = await response.json();
    displayWeeklyForecast(data);
  } catch (error) {
    console.error("Forecast Error:", error);
  }
}

// 주간 날씨 표시 함수 수정
function displayWeeklyForecast(data) {
  // 하루에 하나씩만 표시 (정오 데이터 사용)
  const dailyData = {};

  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateString = date.toLocaleDateString("ko-KR");

    // 정오(12시) 데이터만 사용
    if (date.getHours() === 12 && !dailyData[dateString]) {
      dailyData[dateString] = item;
    }
  });

  // 7일치만 표시
  const forecastArray = Object.values(dailyData).slice(0, 7);

  // 요일 한글로 변환
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  weeklyForecast.innerHTML = forecastArray
    .map((item, index) => {
      const date = new Date(item.dt * 1000);
      const dayName = index === 0 ? "오늘" : dayNames[date.getDay()] + "요일";
      const temp = Math.round(item.main.temp);
      const condition = item.weather[0].main.toLowerCase();
      const iconUrl = getWeatherEmojiUrl(condition);

      return `
        <div class="forecast-card">
          <div class="forecast-day">${dayName}</div>
          <div class="forecast-icon">
            <img src="${iconUrl}" alt="${condition}">
          </div>
          <div class="forecast-temp">${temp}°C</div>
        </div>
      `;
    })
    .join("");
}
function updateWeatherUI(data) {
  // 온도 카운트업 애니메이션
  const temp = Math.round(data.main.temp);
  animateTemperature(temp);

  cityName.textContent = data.name;

  const weatherCondition = data.weather[0].main.toLowerCase();
  weatherIcon.innerHTML = getWeatherEmoji(weatherCondition);

  updateBackground(weatherCondition);

  // 날씨 추천 문구
  weatherMessage.textContent = getWeatherSuggestion(weatherCondition, temp); // weatherSuggestion -> weatherMessage

  const tempMax = Math.round(data.main.temp_max);
  const tempMin = Math.round(data.main.temp_min);
  tempRange.textContent = `${tempMax}°C / ${tempMin}°C`;

  // 체감온도
  const feels = Math.round(data.main.feels_like);
  feelsLike.textContent = `${feels}°C`;

  humidity.textContent = `${data.main.humidity}%`;

  const windSpeed = (data.wind.speed * 3.6).toFixed(2);
  wind.textContent = `${windSpeed}km/h`;

  cloudy.textContent = `${data.clouds.all}%`;

  // 기압
  pressure.textContent = `${data.main.pressure}hPa`;

  // 가시거리 (미터를 킬로미터로)
  const visibilityKm = (data.visibility / 1000).toFixed(1);
  visibility.textContent = `${visibilityKm}km`;

  // 일출/일몰
  const sunriseTime = new Date(data.sys.sunrise * 1000);
  const sunsetTime = new Date(data.sys.sunset * 1000);
  sunrise.textContent = formatTime(sunriseTime);
  sunset.textContent = formatTime(sunsetTime);
}

// 온도 카운트업 애니메이션
function animateTemperature(targetTemp) {
  const duration = 1000; // 1초
  const steps = 30;
  const increment = targetTemp / steps;
  let current = 0;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    current = Math.round(increment * step);

    if (step >= steps) {
      current = targetTemp;
      clearInterval(timer);
    }

    temperature.textContent = `${current}°C`;
  }, duration / steps);
}

// 시간 포맷
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// 날씨 추천 문구
function getWeatherSuggestion(condition, temp) {
  if (condition.includes("rain") || condition.includes("drizzle")) {
    return "☔ 우산을 챙기세요!";
  } else if (condition.includes("snow")) {
    return "⛄ 눈이 내려요! 따뜻하게 입으세요.";
  } else if (condition.includes("thunderstorm")) {
    return "⚡ 천둥번개가 쳐요! 실내에 계세요.";
  } else if (condition.includes("clear")) {
    if (temp > 25) {
      return "🌞 외출하기 좋은 날씨예요!";
    } else if (temp < 5) {
      return "🧥 춥네요! 두껍게 입으세요.";
    } else {
      return "☀️ 맑고 화창한 날이에요!";
    }
  } else if (condition.includes("cloud")) {
    return "☁️ 흐린 날씨네요. 좋은 하루 보내세요!";
  } else if (
    condition.includes("mist") ||
    condition.includes("fog") ||
    condition.includes("haze")
  ) {
    return "🌫️ 안개가 짙어요. 운전 조심하세요!";
  } else {
    return "😊 좋은 하루 보내세요!";
  }
}

function getWeatherEmoji(condition) {
  const iconUrl = getWeatherEmojiUrl(condition);
  return `<img src="${iconUrl}" alt="weather icon">`;
}

function getWeatherEmojiUrl(condition) {
  const weatherEmojis = {
    clear: "img/clear.gif",
    clouds: "img/cloudy.gif",
    rain: "img/rain.gif",
    snow: "img/snow.gif",
    drizzle: "img/rain.gif",
    thunderstorm: "img/rain.gif",
    mist: "img/cloudy.gif",
    fog: "img/cloudy.gif",
    haze: "img/cloudy.gif",
  };

  return weatherEmojis[condition] || "img/clear.gif";
}

function updateBackground(condition) {
  const videoSources = {
    clear: "img/w1.gif",
    clouds: "img/w1.gif",
    rain: "img/rain.gif",
    snow: "img/snow.gif",
  };

  let videoSrc = videoSources.clear;

  if (condition.includes("clear")) {
    videoSrc = videoSources.clear;
  } else if (condition.includes("cloud")) {
    videoSrc = videoSources.clouds;
  } else if (
    condition.includes("rain") ||
    condition.includes("drizzle") ||
    condition.includes("thunderstorm")
  ) {
    videoSrc = videoSources.rain;
  } else if (condition.includes("snow")) {
    videoSrc = videoSources.snow;
  }

  backgroundVideo.src = videoSrc;
}

function togglePanel() {
  searchPanel.classList.toggle("hidden");
}
