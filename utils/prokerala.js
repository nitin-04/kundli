import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = process.env.PROKERALA_CLIENT_ID;
const CLIENT_SECRET = process.env.PROKERALA_CLIENT_SECRET;
const BASE_URL = process.env.PROKERALA_BASE_URL;

export async function getAccessToken() {
  try {
    const response = await axios.post(
      `${BASE_URL}/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    // console.log('Full API Response1:', response);

    return response.data.access_token;
  } catch (err) {
    console.log('Token Error:', err.response?.data || err.message);
    return null;
  }
}

export async function getBirthDetails(datetime, lat, lon) {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(`${BASE_URL}/v2/astrology/birth-details`, {
      params: {
        datetime,
        coordinates: `${lat},${lon}`,
        ayanamsa: 1,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // console.log('Full API Response2:', response);
    // console.log(
    //   'Full Birth Details Response:',
    //   JSON.stringify(response.data, null, 2)
    // );

    return response.data;
  } catch (err) {
    console.log('Prokerala API Error:', err.response?.data || err.message);
    return null;
  }
}
