document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('kundliForm');
  if (!form) {
    return;
  }

  const dobInput = document.getElementById('dob');
  if (dobInput) {
    const today = new Date().toISOString().split('T')[0];
    dobInput.setAttribute('max', today);
  }

  const submitBtn = document.getElementById('submitBtn');
  const placeLoader = document.getElementById('placeLoader');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    document
      .querySelectorAll('.error-msg')
      .forEach((el) => (el.style.display = 'none'));
    document
      .querySelectorAll('input')
      .forEach((el) => el.classList.remove('border-red-500'));

    let isValid = true;

    const nameVal = document.getElementById('name').value;
    if (!/^[a-zA-Z\s]{2,50}$/.test(nameVal)) {
      showError('name', 'nameError');
      isValid = false;
    }

    if (!dobInput.value) {
      showError('dob', 'dobError');
      isValid = false;
    }

    const tobInput = document.getElementById('tob');
    if (!tobInput.value) {
      showError('tob', 'tobError');
      isValid = false;
    }

    const placeInput = document.getElementById('place');
    const city = placeInput.value.trim();

    if (city.length < 2) {
      showError('place', 'placeError');
      isValid = false;
    } else if (isValid) {
      placeLoader.classList.remove('hidden');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Checking Map...';

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${city}&format=json&addressdetails=1&limit=1`
        );
        const data = await response.json();

        placeLoader.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Generate';

        if (data.length === 0) {
          document.getElementById('apiError').style.display = 'block';
          placeInput.classList.add('border-red-500');
        } else {
          const foundPlace = data[0];
          const displayName = foundPlace.display_name;

          placeInput.value = displayName;
          form.submit();
        }
      } catch (error) {
        console.error(error);
        alert('Internet Error: Could not verify location.');
        placeLoader.classList.add('hidden');
        submitBtn.disabled = false;
      }
    }
  });

  function showError(inputId, errorId) {
    const errorEl = document.getElementById(errorId);
    const inputEl = document.getElementById(inputId);
    if (errorEl) errorEl.style.display = 'block';
    if (inputEl) inputEl.classList.add('border-red-500');
  }

  initAutocomplete();
});

function initAutocomplete() {
  const placeInput = document.getElementById('place');
  const suggestionsBox = document.getElementById('suggestions');
  const loader = document.getElementById('placeLoader');
  let timer;

  if (!placeInput || !suggestionsBox) {
    return;
  }

  placeInput.addEventListener('input', () => {
    const query = placeInput.value.trim();

    if (query.length < 2) {
      suggestionsBox.innerHTML = '';
      suggestionsBox.classList.add('hidden');
      return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => fetchSuggestions(query), 400);
  });

  async function fetchSuggestions(query) {
    if (loader) loader.classList.remove('hidden');
    try {
      const res = await fetch(`/search-city?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      showSuggestions(data);
    } catch (err) {
      console.error('Error fetching city list:', err);
    } finally {
      if (loader) loader.classList.add('hidden');
    }
  }

  function showSuggestions(list) {
    suggestionsBox.innerHTML = '';

    if (!list.length) {
      suggestionsBox.classList.add('hidden');
      return;
    }

    list.forEach((item) => {
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
  }

  document.addEventListener('click', (e) => {
    if (!suggestionsBox.contains(e.target) && e.target !== placeInput) {
      suggestionsBox.classList.add('hidden');
    }
  });
}
