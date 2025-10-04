// CSV Helper utilities for bulk import functionality

export const createCSVTemplate = () => {
  const headers = ['name', 'email', 'role'];
  const sampleData = [
    ['John Doe', 'john.doe@example.com', 'STUDENT'],
    ['Jane Smith', 'jane.smith@example.com', 'VERIFIER'],
    ['Bob Johnson', 'bob.johnson@example.com', 'STUDENT']
  ];
  
  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
};

export const downloadCSVTemplate = () => {
  const csvContent = createCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bulk_import_template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const expectedHeaders = ['name', 'email'];
  
  // Check if required headers exist
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 2) continue; // Skip incomplete rows
    
    const row = {};
    headers.forEach((header, index) => {
      if (values[index]) {
        row[header] = values[index];
      }
    });
    
    // Set default role if not provided
    if (!row.role) {
      row.role = 'STUDENT';
    }
    
    // Validate required fields
    if (row.name && row.email) {
      data.push(row);
    }
  }
  
  return data;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCSVData = (data) => {
  const errors = [];
  const validRoles = ['STUDENT', 'VERIFIER'];
  
  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because index starts at 0 and we skip header
    
    if (!row.name || row.name.trim().length < 2) {
      errors.push(`Row ${rowNum}: Name must be at least 2 characters`);
    }
    
    if (!row.email || !validateEmail(row.email)) {
      errors.push(`Row ${rowNum}: Invalid email format`);
    }
    
    if (row.role && !validRoles.includes(row.role.toUpperCase())) {
      errors.push(`Row ${rowNum}: Role must be either STUDENT or VERIFIER`);
    }
  });
  
  return errors;
};