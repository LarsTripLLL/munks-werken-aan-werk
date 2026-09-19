export function saveErrorMessage(reason: unknown): string {
  const message = reason instanceof Error ? reason.message : '';
  if (message.toLowerCase().includes('account is niet actief')) {
    return 'Je account is niet actief. Je wijzigingen worden niet opgeslagen.';
  }
  return 'Opslaan is niet gelukt. Probeer het opnieuw.';
}
