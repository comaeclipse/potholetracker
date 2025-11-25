// Import exifr library from CDN
import('https://cdn.jsdelivr.net/npm/exifr@7/dist/full.umd.js').then(() => {
  initUploadPage();
});

let selectedFiles = []; // Array of { file, extractedData, isValid, imageUrl }

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
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    loadingOverlay.classList.add('active');
    document.querySelector('.loading-text').textContent = `Processing ${files.length} photo${files.length > 1 ? 's' : ''}`;
    document.querySelector('.loading-subtext').textContent = 'Extracting location data...';

    selectedFiles = [];

    // Process all files in parallel
    const processPromises = files.map(async (file) => {
      // Validate file type
      if (!file.type.match('image/jpeg') && !file.type.match('image/jpg') && !file.type.match('image/png')) {
        return {
          file,
          extractedData: null,
          isValid: false,
          imageUrl: null,
          error: 'Invalid file type'
        };
      }

      try {
        // Read file as data URL for preview
        const imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });

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

        console.log(`EXIF data for ${file.name}:`, exifData);

        // Check for GPS coordinates
        if (!exifData || !exifData.latitude || !exifData.longitude) {
          return {
            file,
            extractedData: null,
            isValid: false,
            imageUrl,
            error: 'No GPS data'
          };
        }

        // Extract date/time
        const dateTime = exifData.DateTimeOriginal || exifData.DateTime || exifData.CreateDate || new Date();

        return {
          file,
          extractedData: {
            latitude: exifData.latitude,
            longitude: exifData.longitude,
            dateTime: dateTime instanceof Date ? dateTime : new Date(dateTime)
          },
          isValid: true,
          imageUrl,
          error: null
        };

      } catch (error) {
        console.error(`EXIF extraction error for ${file.name}:`, error);
        return {
          file,
          extractedData: null,
          isValid: false,
          imageUrl: null,
          error: error.message || 'Processing failed'
        };
      }
    });

    try {
      selectedFiles = await Promise.all(processPromises);

      const validCount = selectedFiles.filter(f => f.isValid).length;
      const invalidCount = selectedFiles.length - validCount;

      // Show error if all files are invalid
      if (validCount === 0) {
        loadingOverlay.classList.remove('active');
        showError('None of the selected photos contain GPS location data. Please select photos taken with location services enabled.');
        photoInput.value = '';
        selectedFiles = [];
        return;
      }

      // Display photo grid
      displayPhotoGrid();

      // Show preview section
      uploadSection.style.display = 'none';
      previewSection.classList.add('active');
      loadingOverlay.classList.remove('active');

      // Show info message if some files were skipped
      if (invalidCount > 0) {
        showError(`${invalidCount} photo${invalidCount > 1 ? 's were' : ' was'} skipped (no GPS data). ${validCount} photo${validCount > 1 ? 's are' : ' is'} ready to submit.`);
      }

    } catch (error) {
      console.error('Batch processing error:', error);
      loadingOverlay.classList.remove('active');
      showError('Failed to process photos. Please try again.');
      photoInput.value = '';
      selectedFiles = [];
    }
  }

  function displayPhotoGrid() {
    const photoGrid = document.getElementById('photoGrid');
    const batchSummaryText = document.getElementById('batchSummaryText');
    const batchSummaryDetail = document.getElementById('batchSummaryDetail');

    // Clear existing content
    photoGrid.innerHTML = '';

    // Count valid and invalid photos
    const validPhotos = selectedFiles.filter(f => f.isValid);
    const invalidPhotos = selectedFiles.filter(f => !f.isValid);

    // Update batch summary
    batchSummaryText.textContent = `${selectedFiles.length} photo${selectedFiles.length > 1 ? 's' : ''} selected`;
    batchSummaryDetail.textContent = `${validPhotos.length} valid (with GPS)${invalidPhotos.length > 0 ? `, ${invalidPhotos.length} skipped (no GPS)` : ''}`;

    // Update submit button text
    submitBtn.textContent = `Submit ${validPhotos.length} Report${validPhotos.length > 1 ? 's' : ''}`;

    // Create photo cards
    selectedFiles.forEach((photoData, index) => {
      const card = document.createElement('div');
      card.className = `photo-card ${photoData.isValid ? 'valid' : 'invalid'}`;

      // Create image
      const img = document.createElement('img');
      img.src = photoData.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E';
      img.alt = photoData.file.name;
      card.appendChild(img);

      // Create remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.innerHTML = '<i data-lucide="x"></i>';
      removeBtn.onclick = () => removePhoto(index);
      card.appendChild(removeBtn);

      // Create info section
      const infoDiv = document.createElement('div');
      infoDiv.className = 'photo-info';

      if (photoData.isValid) {
        // Show GPS coordinates
        const gpsDiv = document.createElement('div');
        gpsDiv.className = 'photo-gps';
        gpsDiv.innerHTML = `
          <i data-lucide="map-pin"></i>
          <span>${photoData.extractedData.latitude.toFixed(5)}, ${photoData.extractedData.longitude.toFixed(5)}</span>
        `;
        infoDiv.appendChild(gpsDiv);

        // Show status
        const statusDiv = document.createElement('div');
        statusDiv.className = 'photo-status valid';
        statusDiv.innerHTML = '<i data-lucide="check-circle"></i><span>Ready</span>';
        infoDiv.appendChild(statusDiv);
      } else {
        // Show error status
        const statusDiv = document.createElement('div');
        statusDiv.className = 'photo-status invalid';
        statusDiv.innerHTML = `<i data-lucide="alert-circle"></i><span>${photoData.error || 'No GPS'}</span>`;
        infoDiv.appendChild(statusDiv);
      }

      card.appendChild(infoDiv);
      photoGrid.appendChild(card);
    });

    // Refresh Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function removePhoto(index) {
    selectedFiles.splice(index, 1);

    if (selectedFiles.length === 0) {
      // No photos left, return to upload section
      handleCancel();
    } else {
      // Re-render grid
      displayPhotoGrid();
    }
  }

  async function handleSubmit() {
    // Filter to only valid photos
    const validPhotos = selectedFiles.filter(f => f.isValid);

    if (validPhotos.length === 0) {
      showError('No valid photos to submit.');
      return;
    }

    submitBtn.disabled = true;
    loadingOverlay.classList.add('active');

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    try {
      // Submit reports sequentially
      for (let i = 0; i < validPhotos.length; i++) {
        const photoData = validPhotos[i];

        document.querySelector('.loading-text').textContent = `Submitting Report ${i + 1} of ${validPhotos.length}`;
        document.querySelector('.loading-subtext').textContent = `Processing ${photoData.file.name}...`;

        try {
          // Create title with timestamp
          const title = `Pothole - ${photoData.extractedData.dateTime.toLocaleDateString()} ${photoData.extractedData.dateTime.toLocaleTimeString()}`;

          // Create report data
          const reportData = {
            title: title,
            description: 'Reported via photo upload',
            location: `GPS: ${photoData.extractedData.latitude.toFixed(6)}, ${photoData.extractedData.longitude.toFixed(6)}`,
            latitude: photoData.extractedData.latitude,
            longitude: photoData.extractedData.longitude
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
          console.log(`Report ${i + 1} created:`, result);
          successCount++;

        } catch (error) {
          console.error(`Submission error for ${photoData.file.name}:`, error);
          failCount++;
          errors.push(`${photoData.file.name}: ${error.message}`);
        }
      }

      // Show results
      loadingOverlay.classList.remove('active');

      if (successCount > 0 && failCount === 0) {
        // All succeeded
        showSuccess(`Successfully submitted ${successCount} pothole report${successCount > 1 ? 's' : ''}!`);

        // Reset after 2 seconds and redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);

      } else if (successCount > 0 && failCount > 0) {
        // Partial success
        showError(`Submitted ${successCount} report${successCount > 1 ? 's' : ''}, but ${failCount} failed. Errors: ${errors.join('; ')}`);
        submitBtn.disabled = false;

      } else {
        // All failed
        showError(`Failed to submit all reports. Errors: ${errors.join('; ')}`);
        submitBtn.disabled = false;
      }

    } catch (error) {
      console.error('Batch submission error:', error);
      loadingOverlay.classList.remove('active');
      submitBtn.disabled = false;
      showError(error.message || 'Failed to submit reports. Please try again.');
    }
  }

  function handleCancel() {
    uploadSection.style.display = 'block';
    previewSection.classList.remove('active');
    photoInput.value = '';
    selectedFiles = [];

    // Clear photo grid
    const photoGrid = document.getElementById('photoGrid');
    if (photoGrid) {
      photoGrid.innerHTML = '';
    }

    // Re-enable submit button
    submitBtn.disabled = false;
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
