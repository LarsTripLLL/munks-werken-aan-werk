import type { ParticipantDocument, ParticipantDocumentRepository } from '../domain';

export class SupabaseDocumentRepository implements ParticipantDocumentRepository {
  constructor(private readonly supabaseUrl: string, private readonly publishableKey: string) {}

  private token() {
    const token = localStorage.getItem('munks-werkt-access-token');
    if (!token) throw new Error('Aanmelden is vereist.');
    return token;
  }

  async list(): Promise<ParticipantDocument[]> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/session-api?documents_refresh=${Date.now()}`, {
      cache: 'no-store',
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${this.token()}` },
    });
    if (!response.ok) throw new Error('De documenten konden niet worden geladen.');
    const data = await response.json() as { participantDocuments?: ParticipantDocument[] };
    return data.participantDocuments ?? [];
  }

  async open(document: ParticipantDocument): Promise<void> {
    if (!document.storagePath) throw new Error('Dit document is nog niet beschikbaar om te openen.');
    const response = await fetch(`${this.supabaseUrl}/storage/v1/object/authenticated/participant-documents/${document.storagePath}`, {
      headers: { apikey: this.publishableKey, Authorization: `Bearer ${this.token()}` },
    });
    if (!response.ok) throw new Error('Het document kon niet veilig worden geopend.');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    if (document.type === 'cv') link.download = document.fileName;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
