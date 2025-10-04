// Utility functions for handling user names

export const parseFullName = (fullName) => {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return { firstName, lastName };
};

export const getDisplayName = (user) => {
  if (user?.name) {
    return user.name;
  }
  
  // Fallback for old data format
  if (user?.firstName && user?.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  return user?.firstName || user?.name || 'User';
};

export const getInitials = (user) => {
  if (user?.name) {
    const { firstName, lastName } = parseFullName(user.name);
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  }
  
  // Fallback for old data format
  if (user?.firstName && user?.lastName) {
    return `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase();
  }
  
  return (user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase();
};