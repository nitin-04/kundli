import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBirthDetails } from './utils/prokerala.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate', async (req, res) => {
  const { name, dob, tob, place } = req.body;

  const datetime = `${dob}T${tob}:00+05:30`;

  const lat = 28.6139;
  const lon = 77.209;

  const data = await getBirthDetails(datetime, lat, lon);

  if (!data) {
    return res.send('Error fetching Kundli. Please check API Key.');
  }

  const kundli = {
    name,
    dob,
    tob,
    place,
    api: data?.data || {},

    nakshatra: data?.data?.nakshatra?.name,
    pada: data?.data?.nakshatra?.pada,
    nakshatra_lord: data?.data?.nakshatra?.lord?.name,

    moon_sign: data?.data?.chandra_rasi?.name,
    sun_sign: data?.data?.soorya_rasi?.name,
    western_zodiac: data?.data?.zodiac?.name,

    additional: data?.data?.additional_info || {},
  };

  res.send(`
    <script>
      localStorage.setItem("kundliData", '${JSON.stringify(kundli)}');
      window.location.href = "/result.html";
    </script>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
