# Testdatabase Munks Werkt

Deze map bevat de databasewijzigingen voor een afzonderlijke Supabase-testomgeving.
Gebruik uitsluitend fictieve testgegevens totdat de privacy- en beveiligingscontrole is afgerond.

## Gekozen uitgangspunten

- PostgreSQL via Supabase;
- specifieke regio Frankfurt (`eu-central-1`);
- een afzonderlijk testproject, los van een latere productieomgeving;
- databasewijzigingen alleen via de bestanden in `migrations`;
- Row Level Security standaard gesloten;
- geen wachtwoorden, databasewachtwoorden of service-keys in GitHub.

## Volgorde

1. Maak een leeg Supabase-project aan in Frankfurt.
2. Installeer lokaal de Supabase CLI en een Docker-compatibele omgeving.
3. Initialiseer de lokale Supabase-configuratie in de hoofdmap van de PWA.
4. Koppel uitsluitend het nieuwe testproject.
5. Controleer met een dry-run welke migraties worden toegepast.
6. Test de volledige migratiereeks eerst lokaal met een database-reset.
7. Pas de migraties pas daarna toe op het gekoppelde testproject.
8. Maak afzonderlijke fictieve accounts voor deelnemer, begeleider, applicatiebeheerder en opdrachtgever.
9. Voer geautomatiseerde negatieve tests uit: iedere rol moet verboden gegevens en handelingen geweigerd krijgen.

## Geheimen

Sla de projectreferentie, databasewachtwoorden en geheime sleutels niet op in deze map. Gebruik lokale omgevingsvariabelen of de beveiligde geheimenopslag van de hostingomgeving.

## Belangrijk

De lokale Supabase-omgeving is alleen voor ontwikkeling. Stel deze niet rechtstreeks beschikbaar via internet. Gebruik voor externe tests het afzonderlijke gehoste testproject met TLS, logging en toegangsbeperkingen.
