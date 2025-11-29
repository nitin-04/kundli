document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('kundliForm');
  if (!form) return;

  const dobInput = document.getElementById('dob');
  const placeInput = document.getElementById('place');
  const suggestionsBox = document.getElementById('suggestions');
  const placeLoader = document.getElementById('placeLoader');
  const submitBtn = document.getElementById('submitBtn');

  if (dobInput) {
    const today = new Date().toISOString().split('T')[0];
    dobInput.setAttribute('max', today);
  }

  if (placeInput && suggestionsBox) {
    let timer;

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
      if (placeLoader) placeLoader.classList.remove('hidden');
      try {
        const res = await fetch(
          `/api/search-city?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();

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
        console.error('Error fetching city:', err);
      } finally {
        if (placeLoader) placeLoader.classList.add('hidden');
      }
    }

    document.addEventListener('click', (e) => {
      if (!suggestionsBox.contains(e.target) && e.target !== placeInput) {
        suggestionsBox.classList.add('hidden');
      }
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    document
      .querySelectorAll('.error-msg')
      .forEach((el) => (el.style.display = 'none'));
    document
      .querySelectorAll('input')
      .forEach((el) => el.classList.remove('border-red-500'));

    let isValid = true;

    if (!document.getElementById('name').value.match(/^[a-zA-Z\s]{2,50}$/)) {
      showError('name', 'nameError');
      isValid = false;
    }
    if (!dobInput.value) {
      showError('dob', 'dobError');
      isValid = false;
    }
    if (!document.getElementById('tob').value) {
      showError('tob', 'tobError');
      isValid = false;
    }

    const city = placeInput.value.trim();
    if (city.length < 2) {
      showError('place', 'placeError');
      isValid = false;
    }

    if (isValid) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Verifying Location...';

      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(city)}`
        );
        const data = await response.json();

        if (!data.success) {
          document.getElementById('apiError').style.display = 'block';
          placeInput.classList.add('border-red-500');
          submitBtn.disabled = false;
          submitBtn.innerText = 'Generate';
        } else {
          placeInput.value = data.displayName || city;
          form.submit();
        }
      } catch (error) {
        console.error(error);
        alert('Network error verifying location.');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Generate';
      }
    }
  });

  function showError(inputId, errorId) {
    document.getElementById(errorId).style.display = 'block';
    document.getElementById(inputId).classList.add('border-red-500');
  }
});
