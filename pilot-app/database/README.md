# Database-instructie

## Wat dit bestand al regelt

- organisaties en trajectuitvoeringen;
- accounts en deelnemers;
- begeleiders en projectleiders per traject;
- zeven vaste trajectstappen;
- deelname, voortgang en aanwezigheid;
- privacy- en toestemmingsregistratie;
- activatie-uitnodigingen zonder leesbare codes;
- auditlog;
- Row Level Security met standaard gesloten toegang.

## Belangrijk

`001_core_schema.sql` is een gecontroleerde bouwbasis en nog geen productie-
migratie. Voer het bestand pas uit in een nieuw testproject nadat:

1. een back-up of leeg testproject beschikbaar is;
2. de regio en verwerkingsovereenkomst zijn beoordeeld;
3. de medewerkerrollen zijn vastgesteld;
4. de policies met geautomatiseerde tests zijn gecontroleerd.

## Face ID

Face ID wordt niet rechtstreeks als wachtwoord opgeslagen. Het toestel kan via
een passkey/WebAuthn aanmelden. Omdat passkeyondersteuning in Supabase op het
moment van deze bouwbasis experimenteel is, blijft wachtwoordinlog tijdens de
pilot als alternatief beschikbaar.

## Volgende migraties

- `002_content.sql`: vragen, antwoorden, opdrachten en metingen;
- `004_staff_policies.sql`: definitieve medewerker- en RSD-rechten;
- `005_ai.sql`: begrensde AI-interacties en vrijwillig delen.

## Uitvoervolgorde

1. `001_core_schema.sql`
2. `002_content.sql`
3. `003_participant_functions.sql`
4. `004_pilot_content.sql`
5. `005_documents_messages.sql`
6. `006_participant_messages.sql`
7. `007_coach_messages.sql`
8. `008_message_queries.sql`

De browser krijgt alleen de minimaal benodigde leesrechten. De derde migratie
voegt gecontroleerde opslagfuncties toe voor eigen antwoorden en de eigen
begin- en eindmeting. Deze functies bepalen de deelnemer altijd vanuit de
beveiligde aanmeldsessie en accepteren nooit een deelnemernummer uit het scherm.
