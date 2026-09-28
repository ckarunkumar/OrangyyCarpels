/**
 * Masks a phone number showing only the last few digits.
 * Example: "+91 9008152920" -> "+91 ••••• 2920"
 * Example: "9008152920" -> "••••••2920"
 */
export function maskPhone(phone?: string | null): string {
  if (!phone || phone === '-' || phone.trim() === '') return '—';
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '');
  if (digits.length <= 4) return '••••';
  const lastFour = digits.slice(-4);
  
  if (clean.startsWith('+')) {
    const spaceIdx = clean.indexOf(' ');
    if (spaceIdx > 0 && spaceIdx < 5) {
      const cc = clean.substring(0, spaceIdx);
      return `${cc} ••••• ${lastFour}`;
    }
  }
  return `••••••${lastFour}`;
}

/**
 * Masks an email address showing only initial/final characters before the domain.
 * Example: "arun@orangyy.design" -> "a••••n@orangyy.design"
 */
export function maskEmail(email?: string | null): string {
  if (!email || email === '-' || email.trim() === '') return '—';
  const clean = email.trim();
  const atIndex = clean.indexOf('@');
  if (atIndex <= 0) return '••••••••';
  const name = clean.substring(0, atIndex);
  const domain = clean.substring(atIndex);
  if (name.length <= 2) {
    return `${name[0]}••••${domain}`;
  }
  return `${name[0]}••••${name[name.length - 1]}${domain}`;
}
