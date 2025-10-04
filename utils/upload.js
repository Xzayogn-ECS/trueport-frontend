const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1';

export const uploadToCloudinary = async (file) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`${CLOUDINARY_UPLOAD_URL}/${cloudName}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      public_id: data.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and PDF files are allowed' };
  }

  return { valid: true };
};

export const validateCSVFile = (file) => {
  const maxSize = 2 * 1024 * 1024; // 2MB for CSV files
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];

  if (file.size > maxSize) {
    return { valid: false, error: 'CSV file size must be less than 2MB' };
  }

  if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: 'Only CSV files are allowed' };
  }

  return { valid: true };
};

export const uploadCSVToCloudinary = async (file) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing');
  }

  // Validate CSV file
  const validation = validateCSVFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', 'raw'); // Important: Use 'raw' for non-image files

  try {
    const response = await fetch(`${CLOUDINARY_UPLOAD_URL}/${cloudName}/raw/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      public_id: data.public_id,
      resource_type: data.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary CSV upload error:', error);
    throw error;
  }
};