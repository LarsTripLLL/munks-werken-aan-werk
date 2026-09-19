# API-contract Munks Werkt

Dit contract koppelt de PWA aan een beveiligde server. De browser stuurt nooit
een rol, organisatie of deelnemer-ID mee om toegang te verkrijgen. De server
bepaalt die uitsluitend uit de gevalideerde sessie.

## Sessieregels

- sessiecookie: `Secure`, `HttpOnly` en minimaal `SameSite=Lax`;
- alle mutaties controleren `Origin` en gebruiken bescherming tegen CSRF;
- geen sessiesleutels in `localStorage`;
- antwoorden bevatten `Cache-Control: no-store`;
- iedere route controleert rol, opdrachtgever en trajectkoppeling opnieuw;
- foutmeldingen onthullen niet of een afgeschermde deelnemer bestaat.

## Deelnemersinbox

### `GET /api/participant/messages`

Geeft uitsluitend gesprekken terug van de ingelogde deelnemer.
De server gebruikt hiervoor databasefunctie `list_my_message_threads`.

### `POST /api/participant/messages`

Body:

```json
{
  "kind": "help_request",
  "subject": "Hulp met mijn cv",
  "body": "Kun je mij helpen?"
}
```

De server leidt deelname en begeleider af uit de sessie en trajectkoppeling.

### `POST /api/participant/messages/{threadId}/replies`

Voegt een antwoord toe als het gesprek van de deelnemer is en niet is gesloten.

### `POST /api/participant/messages/{threadId}/read`

Markeert alleen voor deze deelnemer ontvangen berichten als gelezen.

## Begeleidersinbox

### `GET /api/coach/trajectories/{trajectoryCode}/messages`

Geeft alleen gesprekken terug die aan de ingelogde begeleider zijn toegewezen
en binnen een aan die begeleider gekoppeld traject vallen.
De server gebruikt hiervoor databasefunctie `list_my_assigned_threads`.

### `POST /api/coach/messages/{threadId}/replies`

De server gebruikt databasefunctie `reply_as_assigned_coach`.

### `POST /api/coach/messages/{threadId}/read`

De server gebruikt databasefunctie `mark_assigned_thread_read`.

### `POST /api/coach/messages/{threadId}/handled`

De server gebruikt databasefunctie `mark_assigned_thread_handled`.

## Antwoordvorm gesprek

```json
{
  "id": "uuid",
  "kind": "help_request",
  "subject": "Hulp met mijn cv",
  "status": "open",
  "coachName": "Brita",
  "updatedAt": "2026-09-04T11:20:00Z",
  "unread": 1,
  "messages": [
    {
      "id": "uuid",
      "sender": "participant",
      "senderName": "Sam",
      "body": "Kun je mij helpen?",
      "sentAt": "2026-09-04T11:20:00Z",
      "read": false
    }
  ]
}
```

Bij de begeleidersvariant worden tevens `participantId`, `participantName` en
`trajectoryCode` teruggegeven. Deze velden worden door de server samengesteld;
de browser bepaalt ze niet.

## Dashboards en beheer

### `GET /api/dashboard/trajectories`

De server bepaalt de rol en gebruiker uit de sessie en geeft uitsluitend de
toegestane trajecten en velden terug:

- begeleider: alleen gekoppelde trajecten en deelnemers;
- applicatiebeheerder: alleen trajecten binnen de eigen beheeromgeving;
- opdrachtgever: alleen gekoppelde trajecten en de afgesproken dashboardvelden.

Persoonlijke antwoorden, cv's, talententestrapporten en berichten worden nooit
opgenomen in het antwoord voor een opdrachtgever.

### Begeleider en applicatiebeheer

- `PATCH /api/dashboard/trajectories/{code}/participants/{participantId}/attendance`
- `PATCH /api/dashboard/trajectories/{code}/participants/{participantId}/outcome`
- `POST /api/dashboard/trajectories`
- `PATCH /api/dashboard/trajectories/{code}`
- `POST /api/dashboard/trajectories/{code}/participants`
- `PATCH /api/dashboard/trajectories/{code}/participants/{participantId}`

De server controleert per route opnieuw of de gebruiker deze handeling binnen
dit traject en voor deze deelnemer mag uitvoeren. De meegestuurde trajectcode
en deelnemer-ID verlenen op zichzelf nooit toegang.

### Document uploaden

`POST /api/dashboard/trajectories/{code}/participants/{participantId}/documents`

De aanvraag gebruikt `multipart/form-data` met:

- `type`: `cv` of `talent_report`;
- `file`: het document.

De server controleert autorisatie, bestandstype, bestandsgrootte en malware,
slaat het bestand buiten de openbare webmap op en legt upload en download vast
in het auditlog. Een talententestrapport is nooit toegankelijk voor de
opdrachtgever.
