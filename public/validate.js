const dobInput = document.getElementById('dob');
const today = new Date().toISOString().split('T')[0];
dobInput.setAttribute('max', today);

const form = document.getElementById('kundliForm');
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

        const userConfirmed = confirm(
          `We found this location on the map:\n\n📍 ${displayName}\n\nIs this correct?`
        );

        if (userConfirmed) {
          placeInput.value = displayName;
          form.submit();
        } else {
          placeInput.focus();
        }
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
  document.getElementById(errorId).style.display = 'block';
  document.getElementById(inputId).classList.add('border-red-500');
}
