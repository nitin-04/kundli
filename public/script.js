const nakshatras = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashirsha',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
];
function getCalculatedNakshatra(longitude) {
  if (longitude === undefined || longitude === null) return '-';
  const index = Math.floor(longitude / 13.333333);
  return nakshatras[index % 27];
}

const rawData = localStorage.getItem('kundliData');

if (!rawData) {
  document.getElementById('error-box').innerText =
    'No data found. Please generate again.';
  document.getElementById('error-box').classList.remove('hidden');
} else {
  try {
    const data = JSON.parse(rawData);
    const api = data.api || {};
    const planets = api.planet_positions || [];

    const ascendant = planets.find(
      (p) => p.name === 'Ascendant' || p.name === 'Lagna'
    ) || { rasi: { id: 0, name: 'Aries' } };
    const lagnaId = ascendant.rasi.id;

    document.getElementById('personal-info').innerHTML = `
               <h3 class="font-bold text-orange-800 text-lg mb-3">Birth Details</h3>
               <div class="grid grid-cols-2 gap-y-2 text-sm">
                  <div>Name: <span class="font-semibold">${
                    data.name || '-'
                  }</span></div>
                  <div>Date: <span class="font-semibold">${
                    data.dob || '-'
                  }</span></div>
                  <div>Time: <span class="font-semibold">${
                    data.tob || '-'
                  }</span></div>
                  <div>Place: <span class="font-semibold">${
                    data.place || '-'
                  }</span></div>
               </div>
            `;
    document.getElementById('astro-info').innerHTML = `
               <h3 class="font-bold text-purple-800 text-lg mb-3">Astro Details</h3>
               <div class="grid grid-cols-2 gap-y-2 text-sm">
                  <div>Ascendant: <span class="font-semibold">${
                    ascendant.rasi.name
                  }</span></div>
                  <div>Moon: <span class="font-semibold">${
                    api.chandra_rasi?.name || '-'
                  }</span></div>
                  <div>Sun: <span class="font-semibold">${
                    api.soorya_rasi?.name || '-'
                  }</span></div>
                  <div>Nakshatra: <span class="font-semibold">${
                    api.nakshatra?.name || '-'
                  }</span></div>
               </div>
            `;

    const tableBody = document.getElementById('planet-table-body');
    const getHouse = (planetRasiId) => ((planetRasiId - lagnaId + 12) % 12) + 1;

    planets.forEach((p) => {
      if (p.name === 'Ascendant') return;
      let degreeVal = (p.norm_degree || p.degree || 0).toFixed(2);

      let nakName = '-';
      if (p.nakshatra && typeof p.nakshatra === 'object')
        nakName = p.nakshatra.name;
      else if (p.nakshatra && typeof p.nakshatra === 'string')
        nakName = p.nakshatra;
      if (!nakName || nakName === '-') {
        let totalDeg = p.norm_degree;
        if (!totalDeg && p.rasi && p.degree)
          totalDeg = p.rasi.id * 30 + parseFloat(p.degree);
        nakName = getCalculatedNakshatra(totalDeg);
      }

      const isRetro = p.is_retrograde
        ? '<span class="text-red-500 font-bold text-xs bg-red-100 px-2 py-0.5 rounded">R</span>'
        : '<span class="text-green-600 text-xs">Direct</span>';

      const pRasiId = p.rasi?.id !== undefined ? p.rasi.id : 0;
      const houseNum = getHouse(pRasiId);

      tableBody.innerHTML += `
                <tr class="hover:bg-indigo-50">
                  <td class="p-4 font-medium">${p.name}</td>
                  <td class="p-4 text-gray-600">${p.rasi?.name || '-'}</td>
                  <td class="p-4 text-sm font-mono">${degreeVal}°</td>
                  <td class="p-4 text-sm">${nakName}</td>
                  <td class="p-4">${isRetro}</td>
                  <td class="p-4 font-bold text-orange-600">${houseNum}</td>
                </tr>
              `;
    });

    renderChart(planets, lagnaId, getHouse);
  } catch (err) {
    console.error(err);
    document.getElementById('error-box').innerText = 'Error: ' + err.message;
    document.getElementById('error-box').classList.remove('hidden');
  }
}

function renderChart(planets, lagnaId, getHouseFn) {
  const houseData = {};
  for (let i = 1; i <= 12; i++) {
    const currentRashiId = (lagnaId + i - 1) % 12;
    const planetsInHouse = planets
      .filter((p) => {
        const rId = p.rasi?.id !== undefined ? p.rasi.id : -99;
        return p.name !== 'Ascendant' && getHouseFn(rId) === i;
      })
      .map((p) => p.name.substring(0, 2));

    houseData[i] = {
      rashiNum: currentRashiId + 1,
      planets: planetsInHouse,
    };
  }

  const config = {
    // H8 Top Diamond
    1: { num: { x: 50, y: 12, anchor: 'middle' }, list: { x: 50, y: 30 } },

    // H9 Top Left Triangle
    2: { num: { x: 17, y: 5, anchor: 'end' }, list: { x: 27, y: 10 } },

    // H10 Left Top Triangle
    3: { num: { x: 1, y: 19, anchor: 'start' }, list: { x: 12, y: 25 } },

    // H11 Left Diamond
    4: { num: { x: 6, y: 52, anchor: 'start' }, list: { x: 30, y: 50 } },

    // H12 Left Bot Triangle
    5: { num: { x: 2, y: 70, anchor: 'start' }, list: { x: 5, y: 75 } },

    // H1 Bot Left Triangle
    6: {
      num: { x: 25, y: 99, anchor: 'middle' },
      list: { x: 25, y: 85 },
    },

    // H2 Bot Diamond
    7: {
      num: { x: 50, y: 94, anchor: 'middle' },
      list: { x: 50, y: 70 },
    },

    // H3 Bot Right Triangle
    8: {
      num: { x: 75, y: 99, anchor: 'middle' },
      list: { x: 75, y: 85 },
    },

    // H4 Right Bot Triangle
    9: { num: { x: 99, y: 75, anchor: 'end' }, list: { x: 85, y: 75 } },

    // H5 Right Diamond
    10: { num: { x: 95, y: 52, anchor: 'end' }, list: { x: 70, y: 50 } },

    // H6 Right Top Triangle
    11: { num: { x: 99, y: 25, anchor: 'end' }, list: { x: 85, y: 25 } },

    // H7 Top Right Triangle
    12: {
      num: { x: 75, y: 7, anchor: 'middle' },
      list: { x: 75, y: 15 },
    },
  };

  let svgContent = '';

  for (let h = 1; h <= 12; h++) {
    const conf = config[h].num;
    svgContent += `<text x="${conf.x}" y="${conf.y}" text-anchor="${conf.anchor}" class="rashi-num" dominant-baseline="auto">${houseData[h].rashiNum}</text>`;
  }

  for (let h = 1; h <= 12; h++) {
    const center = config[h].list;
    const pList = houseData[h].planets;
    const count = pList.length;

    if (count > 0) {
      let fontSize = '4px';

      // Grid Logic
      let cols = Math.ceil(Math.sqrt(count));
      let rows = Math.ceil(count / cols);

      const xGap = 10;
      const yGap = 8;

      const startX = center.x - ((cols - 1) / 2) * xGap;
      const startY = center.y - ((rows - 1) / 2) * yGap;

      pList.forEach((p, idx) => {
        let col = idx % cols;
        let row = Math.floor(idx / cols);

        const finalX = startX + col * xGap;
        const finalY = startY + row * yGap;

        svgContent += `<text x="${finalX}" y="${finalY}" class="planet-text" style="font-size: ${fontSize}">${p}</text>`;
      });
    }
  }

  const svg = `
          <svg viewBox="0 0 100 100" class="chart-svg">
            <rect x="0" y="0" width="100" height="100" fill="none" stroke="#f97316" stroke-width="1" />
            <path d="M0,0 L100,100" stroke="#f97316" stroke-width="1" />
            <path d="M100,0 L0,100" stroke="#f97316" stroke-width="1" />
            <path d="M50,0 L100,50 L50,100 L0,50 Z" fill="none" stroke="#f97316" stroke-width="1" />
            ${svgContent}
          </svg>
        `;
  document.getElementById('chart-mount').innerHTML = svg;
}
