import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import {
  getBirthDetails,
  getPlanetPositions,
  getPanchang,
} from '../utils/prokerala.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static('public'));

app.get('/search-city', async (req, res) => {
  const q = req.query.q;

  if (!q || q.length < 2) return res.json([]);

  try {
    const response = await axios.get(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/cities`,
      {
        params: {
          namePrefix: q,
          countryIds: 'IN',
          limit: 10,
          sort: '-population',
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPID_KEY,
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
        },
      }
    );

    const result = response.data.data.map((city) => ({
      display_name: `${city.city}, ${city.region}, India`,
      lat: city.latitude,
      lon: city.longitude,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

async function getCoordinates(city) {
  try {
    console.log(`Looking up coordinates for: ${city}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      city
    )}&format=json&limit=1`;

    const response = await axios.get(url, {
      headers: { 'User-Agent': 'KundliApp/1.0' },
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { lat, lon };
    } else {
      console.log('City not found, defaulting to New Delhi');
      return { lat: 28.6139, lon: 77.209 };
    }
  } catch (error) {
    console.error('Geocoding Error:', error.message);
    return { lat: 28.6139, lon: 77.209 };
  }
}

// app.get('/', (req, res) => {
//   res.sendFile(path.resolve('public/index.html'));
// });

app.post('/generate', async (req, res) => {
  const { name, dob, tob, place } = req.body;
  const datetime = `${dob}T${tob}:00+05:30`;

  const coords = await getCoordinates(place);
  const lat = coords.lat;
  const lon = coords.lon;

  console.log(`Using Coordinates: ${lat}, ${lon}`);

  try {
    console.log('Fetching data for:', datetime);

    const [birthData, planetData, panchangData] = await Promise.all([
      getBirthDetails(datetime, lat, lon),
      getPlanetPositions(datetime, lat, lon),
      getPanchang(datetime, lat, lon),
    ]);

    if (!birthData?.data || !planetData?.data) {
      console.error('API Error: Missing data payload');
      return res.send('Error fetching Kundli data. Please check API Key.');
    }

    let planetsArray = [];
    const rawPlanets = planetData.data.planet_position;

    if (Array.isArray(rawPlanets)) {
      planetsArray = rawPlanets;
    } else if (typeof rawPlanets === 'object' && rawPlanets !== null) {
      planetsArray = Object.values(rawPlanets);
    }

    const kundli = {
      name,
      dob,
      tob,
      place,
      lat,
      lon,
      api: {
        birth_details: birthData.data,
        planet_positions: planetsArray,
        panchang: panchangData?.data || null,
      },
    };

    res.send(`
      <script>
        localStorage.setItem("kundliData", '${JSON.stringify(kundli).replace(
          /'/g,
          "\\'"
        )}');
        window.location.href = "/result.html";
      </script>
    `);
  } catch (error) {
    console.error('Server Error:', error);
    res.send('Server Error generating Kundli. Check terminal logs.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
