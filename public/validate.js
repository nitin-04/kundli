console.log('🚀 Validate.js is running!'); // If you don't see this, the file isn't loading.

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM Content Loaded');

  const form = document.getElementById('kundliForm');
  if (!form) {
    console.warn('⚠️ Form not found! (Are you on the result page?)');
    return;
  }

  const placeInput = document.getElementById('place');
  const suggestionsBox = document.getElementById('suggestions');
  const placeLoader = document.getElementById('placeLoader');

  if (!placeInput) console.error('❌ Place Input NOT found');
  if (!suggestionsBox) console.error('❌ Suggestions Box NOT found');

  if (placeInput && suggestionsBox) {
    console.log('✅ Typeahead initialized. Waiting for input...');

    let timer;
    placeInput.addEventListener('input', () => {
      const query = placeInput.value.trim();
      console.log(`⌨️ Typing detected: ${query}`); // THIS must appear when you type

      if (query.length < 2) {
        suggestionsBox.classList.add('hidden');
        return;
      }

      clearTimeout(timer);
      timer = setTimeout(() => fetchSuggestions(query), 400);
    });

    async function fetchSuggestions(query) {
      console.log(`🌍 Fetching suggestions for: ${query}`);
      if (placeLoader) placeLoader.classList.remove('hidden');

      try {
        const res = await fetch(`/search-city?q=${encodeURIComponent(query)}`);
        console.log(`📡 Server response status: ${res.status}`);

        const data = await res.json();
        console.log('📦 Data received:', data);

        suggestionsBox.innerHTML = '';
        if (!data.length) {
          suggestionsBox.classList.add('hidden');
          return;
        }

        data.forEach((item) => {
          const div = document.createElement('div');
          div.textContent = item.display_name;
          div.className =
            'p-2 cursor-pointer hover:bg-orange-100 border-b last:border-b-0 text-black';
          div.addEventListener('click', () => {
            placeInput.value = item.display_name;
            suggestionsBox.classList.add('hidden');
          });
          suggestionsBox.appendChild(div);
        });
        suggestionsBox.classList.remove('hidden');
      } catch (err) {
        console.error('❌ Error fetching city:', err);
      } finally {
        if (placeLoader) placeLoader.classList.add('hidden');
      }
    }
  }
});
