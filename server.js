const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://root:root@cluster0.phgjs7e.mongodb.net/shamith-weather-db?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const weatherSchema = new mongoose.Schema(
  {
    city: String,
    datetime: String,
    temperature: Number,
    humidity: Number,
    realfeel: Number,
    sky: String,
    pressure: Number,
    wind: Number,
    precipitation: Number,
  },
  { collection: "weatherdata" }
);

const Weather = mongoose.model("weather", weatherSchema);

app.get("/weather", async (req, res) => {
  try {
    const records = await Weather.find().sort({ timestamp: -1 }).limit(50);
    res.json(records);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    res.status(500).send("Error fetching weather data");
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Fetch and save weather data
const fetchWeatherData = async () => {
  try {
    const options = {
      method: "GET",
      url: "https://weatherapi-com.p.rapidapi.com/current.json?q=7.1247,79.8750",
      headers: {
        "x-rapidapi-key": "89457a739fmsh91811aee1b0251cp13d3ecjsnbba08bb1b46a",
        "x-rapidapi-host": "weatherapi-com.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);
    console.log("API Response:", response.data); // Log API response
    return response.data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};

const fetchAndSave = async () => {
  const results = await fetchWeatherData();

  if (results) {
    let data = getSaveObject(results);
    console.log("Data to save:", data); // Log data to save
    const weather = new Weather(data);
    try {
      const res = await weather.save();
      console.log("Weather data saved successfully");
    } catch (error) {
      console.error("Error saving weather data:", error);
    }
  }
};

const getSaveObject = (data) => {
  return {
    city: data.location.name,
    datetime: data.current.last_updated,
    temperature: data.current.temp_c,
    humidity: data.current.humidity,
    realfeel: data.current.feelslike_c,
    sky: data.current.condition.text,
    pressure: data.current.pressure_mb,
    wind: data.current.wind_kph,
    precipitation: data.current.precip_mm,
  };
};

// Schedule to run every 30 minutes
setInterval(fetchAndSave, 1800000); // 1800000 ms = 30 minutes

// Initial fetch
fetchAndSave();
