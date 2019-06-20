#! /usr/bin/env node

const yargs = require('yargs');
const axios = require('axios');
const moment = require('moment');

const argv = yargs
  .options({
    a: {
      demand: true,
      alias: 'address',
      describe: 'Address to fetch weather for',
      string: true
    }
  })
  .help()
  .alias('help', 'h')
  .argv;

const encodedAddress = encodeURIComponent(argv.address);
const url = `https://www.mapquestapi.com/geocoding/v1/address` +
  `?key=ntDn9JalUTAJXNehXiJMvnzqHz6DyeSq&location=${encodedAddress}`;

axios.get(url)
  .then((response) => {
    if (!response.data.results) {
      throw new Error('Addres not found, please try again.');
    }

    const lat = response.data.results[0].locations[0].latLng.lat;
    const lng = response.data.results[0].locations[0].latLng.lng;
    if (lat === 39.390897 && lng === -99.066067) {
      throw new Error('Address not found, please try again.');
    }

    let api_key = process.env.DARK_SKY_API_KEY;
    api_key = "5a0b7fe22a2acade1e10b6b62b188762";
    const weatherUrl = `https://api.darksky.net/forecast/${api_key}/` +
      `${lat},${lng}?lang=en&units=si&exclude=hourly,flags`;

    return axios.get(weatherUrl);
  })
  .then((response) => {
    const todayWeatherData = response.data.daily.data[0];
    const todayWeatherForecast = getWeatherForecastFromData(todayWeatherData);
    printWeatherForecast(todayWeatherForecast);
  })
  .catch((error) => {
    if (error.code === 'ENOTFOUND') {
      console.log('Unable to connect to API servers.');
    } else {
      console.log(error.message);
    }
  });

const getWeatherForecastFromData = (data) => {
  return {
    summary: data.summary,
    maxTemp: data.temperatureMax,
    minTemp: data.temperatureMin,
    apparentMinTemp: data.apparentTemperatureMin,
    apparentMaxTemp: data.apparentTemperatureMax,
    humidity: data.humidity,
    cloudCover: data.cloudCover,
    precipitationProbability: data.precipProbability,
    precipitationIntensity: data.precipIntensity,
    uvIndex: data.uvIndex,
    uvDamageRisk: calculateUvDamageRisk(data.uvIndex),
    uvIndexTime: moment.unix(data.uvIndexTime).format('HH:mm'),
    windSpeed: data.windSpeed,
    sunriseTime: moment.unix(data.sunriseTime).format('HH:mm'),
    sunsetTime: moment.unix(data.sunsetTime).format('HH:mm')
  };
};

const calculateUvDamageRisk = (uvIndex) => {
  if (0 <= uvIndex && uvIndex < 3) return 'Low';
  if (3 <= uvIndex && uvIndex < 6) return 'Moderate';
  if (6 <= uvIndex && uvIndex < 8) return 'High';
  if (8 <= uvIndex && uvIndex < 11) return 'Very high';
  if (11 <= uvIndex) return 'Extreme';
};

const printWeatherForecast = (weather) => {
  console.log(`
Forecast for today ${moment().format('DD/MM/YYYY')}

${weather.summary}
    
Max temperature: ${weather.maxTemp}°C
Min temperature: ${weather.minTemp}°C
Min apparent temperature: ${weather.apparentMinTemp}°C
Max apparent temperature: ${weather.apparentMaxTemp}°C
Humidity: ${weather.humidity}
Cloud cover percentage: ${Math.trunc(weather.cloudCover * 100)}%
Precipitation probability: ${weather.precipitationProbability} with intensity of ${weather.precipitationIntensity}mm/h
UV index: ${weather.uvIndex}
Max UV index at: ${weather.uvIndexTime}
Damage risk due to unprotected sun exposure: ${weather.uvDamageRisk}
Wind speed: ${weather.windSpeed}m/s
Today the sun rises at: ${weather.sunriseTime}
Today the sun sets at: ${weather.sunsetTime}`);
};