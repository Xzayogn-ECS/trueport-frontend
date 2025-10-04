export function buildVCardBlob({ user = {}, contacts = {} }) {
  const safe = (s) => (s || '').toString().replace(/\n/g, '\\n');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${safe(user.name) || ''};;;;`,
    `FN:${safe(user.name) || ''}`,
  ];

  if (contacts.email) lines.push(`EMAIL;TYPE=INTERNET:${safe(contacts.email)}`);
  if (contacts.phone) lines.push(`TEL;TYPE=CELL:${safe(contacts.phone)}`);
  if (contacts.linkedin) lines.push(`URL:${safe(contacts.linkedin)}`);
  if (user.githubUsername && contacts.github) lines.push(`URL:${safe(contacts.github)}`);
  if (user.institute) lines.push(`ORG:${safe(user.institute)}`);
  if (user.role) lines.push(`TITLE:${safe(user.role)}`);
  if (user.bio) lines.push(`NOTE:${safe(user.bio)}`);

  lines.push('END:VCARD');
  const content = lines.join('\r\n');
  return new Blob([content], { type: 'text/vcard' });
}
