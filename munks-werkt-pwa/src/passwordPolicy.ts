export const passwordMinimum = 12;
export const passwordMaximum = 128;

const commonTerms = [
  'password', 'wachtwoord', 'welkom', 'qwerty', 'letmein', 'changeme',
  'admin', 'administrator', 'munkswerkt', 'iloveyou', '123456', '123456789',
];

const normalized = (value: string) => value.toLocaleLowerCase('nl-NL').replace(/[^a-z0-9]/g, '');

export const passwordPolicyError = (password: string, accountValues: string[] = []): string | undefined => {
  if (password.length < passwordMinimum || password.length > passwordMaximum) {
    return `Gebruik een wachtwoord van ${passwordMinimum} tot en met ${passwordMaximum} tekens.`;
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Gebruik minimaal één kleine letter, hoofdletter, cijfer en speciaal teken.';
  }
  const compact = normalized(password);
  if (commonTerms.some(term => compact.includes(term))) {
    return 'Kies geen veelgebruikt wachtwoord of herkenbare standaardtekst.';
  }
  if (/^(.)\1+$/.test(compact) || /^(.{1,8})\1+$/.test(compact)) {
    return 'Gebruik geen herhaling van steeds dezelfde letters, cijfers of korte tekst.';
  }
  const derivedValues = accountValues
    .flatMap(value => [value, value.split('@')[0] ?? ''])
    .map(normalized)
    .filter(value => value.length >= 4);
  if (derivedValues.some(value => compact.includes(value))) {
    return 'Gebruik geen naam of e-mailadres uit je account in het wachtwoord.';
  }
  return undefined;
};

export const passwordHelp = 'Minimaal 12 tekens met een kleine letter, hoofdletter, cijfer en speciaal teken. Gebruik geen naam, e-mailadres of veelgebruikt wachtwoord.';
