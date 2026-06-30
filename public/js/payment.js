// Payment Card Validation and Interactive Preview Sync

document.addEventListener('DOMContentLoaded', () => {
  const cardNumberInput = document.getElementById('card-number');
  const cardExpiryInput = document.getElementById('card-expiry');
  const cardCvcInput = document.getElementById('card-cvc');
  const cardNameInput = document.getElementById('card-name');

  const previewNumber = document.getElementById('card-preview-number');
  const previewName = document.getElementById('card-preview-name');
  const previewExpiry = document.getElementById('card-preview-expiry');
  const previewBrand = document.getElementById('card-preview-brand');

  if (!cardNumberInput) return; // Guard in case script loaded outside auth state

  // 1. Format Card Number and Sync Preview
  cardNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = '';
    
    // Auto-spacing every 4 digits
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }
    
    e.target.value = formattedValue;
    
    // Sync Preview
    if (formattedValue.length === 0) {
      previewNumber.textContent = '•••• •••• •••• ••••';
    } else {
      previewNumber.textContent = formattedValue;
    }

    // Detect Card Brand
    detectCardBrand(value);
  });

  // 2. Format Expiry and Sync Preview
  cardExpiryInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = '';
    
    if (value.length > 2) {
      formattedValue = value.substring(0, 2) + '/' + value.substring(2, 4);
    } else {
      formattedValue = value;
    }
    
    e.target.value = formattedValue;

    if (formattedValue.length === 0) {
      previewExpiry.textContent = 'MM/YY';
    } else {
      previewExpiry.textContent = formattedValue;
    }
  });

  // 3. Sync Name and Capitalize
  cardNameInput.addEventListener('input', (e) => {
    const value = e.target.value.toUpperCase();
    if (value.length === 0) {
      previewName.textContent = 'YOUR NAME';
    } else {
      previewName.textContent = value;
    }
  });

  // Card brand detection helper
  function detectCardBrand(number) {
    if (number.startsWith('4')) {
      previewBrand.textContent = 'VISA';
      previewBrand.style.color = '#38bdf8'; // Light Blue
    } else if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(number)) {
      previewBrand.textContent = 'MASTERCARD';
      previewBrand.style.color = '#fb923c'; // Orange
    } else if (number.startsWith('34') || number.startsWith('37')) {
      previewBrand.textContent = 'AMEX';
      previewBrand.style.color = '#2dd4bf'; // Teal
    } else {
      previewBrand.textContent = 'CARD';
      previewBrand.style.color = '#ffffff';
    }
  }
});
