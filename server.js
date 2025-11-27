import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBirthDetails, getPlanetPositions } from './utils/prokerala.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/generate', async (req, res) => {
  const { name, dob, tob, place } = req.body;
  const datetime = `${dob}T${tob}:00+05:30`;

  const lat = 28.6139;
  const lon = 77.209;

  try {
    console.log('Fetching data for:', datetime);

    const [birthData, planetData] = await Promise.all([
      getBirthDetails(datetime, lat, lon),
      getPlanetPositions(datetime, lat, lon),
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
      api: {
        ...birthData.data,
        planet_positions: planetsArray,
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
