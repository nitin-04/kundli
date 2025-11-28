import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import {
  getBirthDetails,
  getPlanetPositions,
  // getMangalDosha,
  getPanchang,
} from './utils/prokerala.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

    console.log('Birth Data Status:', birthData ? 'Received' : 'Failed');
    console.log('Planet Data Status:', planetData ? 'Received' : 'Failed');

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

    console.log(`Processed ${planetsArray.length} planets.`);

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
        // dosha: doshaData?.data || null,
        panchang: panchangData?.data || null,
      },
    };
    // console.log('Stats:');
    // console.log(`- Dosha Received: ${!!doshaData}`);
    // console.log(`- Panchang Received: ${!!panchangData}`);

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
