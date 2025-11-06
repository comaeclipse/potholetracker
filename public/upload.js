// Import exifr library from CDN
import('https://cdn.jsdelivr.net/npm/exifr@7/dist/full.umd.js').then(() => {
  initUploadPage();
});

let selectedFile = null;
let extractedData = null;

function initUploadPage() {
  const photoInput = document.getElementById('photoInput');
  const uploadSection = document.getElementById('uploadSection');
  const previewSection = document.getElementById('previewSection');
  const previewImage = document.getElementById('previewImage');
  const submitBtn = document.getElementById('submitBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');

  photoInput.addEventListener('change', handleFileSelect);
  submitBtn.addEventListener('click', handleSubmit);
  cancelBtn.addEventListener('click', handleCancel);

  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image/jpeg') && !file.type.match('image/jpg') && !file.type.match('image/png')) {
      showError('Please select a JPEG or PNG image file.');
      return;
    }

    selectedFile = file;
    loadingOverlay.classList.add('active');

    try {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
      };
      reader.readAsDataURL(file);

      // Extract EXIF data
      const exifData = await window.exifr.parse(file, {
        gps: true,
        tiff: true,
        exif: true,
        xmp: true,
        icc: false,
        iptc: false,
        jfif: false,
        ihdr: false
      });

      console.log('EXIF data:', exifData);

      if (!exifData) {
        throw new Error('No EXIF data found in this image.');
      }

      // Extract GPS coordinates
      if (!exifData.latitude || !exifData.longitude) {
        throw new Error('This image does not contain GPS location data. Please use a photo taken with location services enabled.');
      }

      // Extract date/time
      const dateTime = exifData.DateTimeOriginal || exifData.DateTime || exifData.CreateDate || new Date();

      extractedData = {
        latitude: exifData.latitude,
        longitude: exifData.longitude,
        dateTime: dateTime instanceof Date ? dateTime : new Date(dateTime)
      };

      // Display EXIF info
      displayExifInfo(extractedData);

      // Show preview section
      uploadSection.style.display = 'none';
      previewSection.classList.add('active');
      loadingOverlay.classList.remove('active');

    } catch (error) {
      console.error('EXIF extraction error:', error);
      loadingOverlay.classList.remove('active');
      showError(error.message || 'Failed to extract location data from the image. Please ensure the photo was taken with location services enabled.');
      photoInput.value = '';
      selectedFile = null;
    }
  }

  function displayExifInfo(data) {
    // Format date
    const dateStr = data.dateTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format time
    const timeStr = data.dateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Format coordinates
    const locationStr = `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`;

    document.getElementById('dateValue').textContent = dateStr;
    document.getElementById('dateInfo').style.display = 'flex';

    document.getElementById('timeValue').textContent = timeStr;
    document.getElementById('timeInfo').style.display = 'flex';

    document.getElementById('locationValue').textContent = locationStr;
    document.getElementById('locationInfo').style.display = 'flex';

    // Refresh Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  async function handleSubmit() {
    if (!selectedFile || !extractedData) {
      showError('No file selected or EXIF data missing.');
      return;
    }

    submitBtn.disabled = true;
    loadingOverlay.classList.add('active');
    document.querySelector('.loading-text').textContent = 'Uploading Report';
    document.querySelector('.loading-subtext').textContent = 'Please wait...';

    try {
      // Create title with timestamp
      const title = `Pothole - ${extractedData.dateTime.toLocaleDateString()} ${extractedData.dateTime.toLocaleTimeString()}`;

      // Create report data
      const reportData = {
        title: title,
        description: 'Reported via photo upload',
        location: `GPS: ${extractedData.latitude.toFixed(6)}, ${extractedData.longitude.toFixed(6)}`,
        latitude: extractedData.latitude,
        longitude: extractedData.longitude
      };

      // Send to API
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }

      const result = await response.json();
      console.log('Report created:', result);

      // Show success message
      loadingOverlay.classList.remove('active');
      showSuccess('Pothole report submitted successfully!');

      // Reset after 2 seconds and redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error('Submission error:', error);
      loadingOverlay.classList.remove('active');
      submitBtn.disabled = false;
      showError(error.message || 'Failed to submit report. Please try again.');
    }
  }

  function handleCancel() {
    uploadSection.style.display = 'block';
    previewSection.classList.remove('active');
    photoInput.value = '';
    selectedFile = null;
    extractedData = null;

    // Hide EXIF info
    document.getElementById('dateInfo').style.display = 'none';
    document.getElementById('timeInfo').style.display = 'none';
    document.getElementById('locationInfo').style.display = 'none';
  }

  function showError(message) {
    const alertError = document.getElementById('alertError');
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = message;
    alertError.classList.add('active');

    // Refresh Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    setTimeout(() => {
      alertError.classList.remove('active');
    }, 5000);
  }

  function showSuccess(message) {
    const alertSuccess = document.getElementById('alertSuccess');
    const successMessage = document.getElementById('successMessage');

    successMessage.textContent = message;
    alertSuccess.classList.add('active');

    // Refresh Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    setTimeout(() => {
      alertSuccess.classList.remove('active');
    }, 3000);
  }
}
