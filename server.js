import express from 'express';
import bodyParser from 'body-parser';
import { getBirthDetails } from './utils/prokerala.js';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

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

app.listen(3000, () => console.log('Running at http://localhost:3000'));
