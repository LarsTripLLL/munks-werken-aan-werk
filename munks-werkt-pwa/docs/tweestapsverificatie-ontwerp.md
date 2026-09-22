# Tweestapsverificatie - ontwerp, nog niet geactiveerd

Status: gefaseerde lokale bouw. Fase 1 tot en met 4 staan lokaal klaar. De migratie `supabase/migrations/202609220031_mfa_foundation.sql` voegt een standaard uitgeschakelde beveiligingsinstelling en de centrale AAL2-controle toe. De TOTP-aanroepen in `src/mfa/MfaAuthClient.ts` zijn aangesloten op de inlogroute. De app bevat schermen voor QR-koppeling, een met één knop kopieerbare handmatige sleutel en de zescijferige code bij volgende aanmeldingen. De migratie `supabase/migrations/202609220032_mfa_data_gate.sql` schermt na activering browserdata, berichten en documenten af. De session-api en AI-functie weigeren dan eveneens een AAL1-sessie. Zolang `mfa_required` uit staat ziet geen gebruiker de MFA-schermen en blijven de nieuwe toegangsregels doorlatend. De beheerdersschakelaar en factor-reset zijn lokaal gebouwd; end-to-endtests en de expliciete live-activering volgen later.

## Afgesproken keuze

- Een authenticator-app (TOTP) is de tweede stap naast het wachtwoord.
- De eigenaar beslist later of de functie wordt ingeschakeld.
- Als de functie wordt ingeschakeld, geldt zij voor alle rollen: deelnemers, begeleiders, opdrachtgevers en beheerders.
- Alleen een bevoegde beheerder mag de algemene verplichting wijzigen. Uitschakelen of inschakelen vraagt een bevestiging en wordt gelogd.
- Bij verlies van een telefoon kan een bevoegde beheerder na identiteitscontrole de bestaande factor resetten. De beheerder krijgt nooit het geheime TOTP-sleutelmateriaal te zien; de gebruiker moet zelf een nieuwe factor instellen.

## Gebruikersroute

1. De gebruiker voert e-mailadres en wachtwoord in.
2. Als tweestapsverificatie aan staat en nog geen authenticator is gekoppeld, toont de app een QR-code en een handmatige sleutel. De gebruiker scant deze en bevestigt met een code.
3. Als er al een factor is gekoppeld, vraagt de app de actuele code.
4. Pas na succesvolle verificatie opent de app trajectgegevens. Na verversen moet de beveiligde sessie behouden blijven.
5. Als de telefoon kwijt is, neemt de gebruiker contact op met de beheerder. Na identiteitscontrole reset de beheerder de factor en wordt dit vastgelegd. Daarna moet de gebruiker opnieuw koppelen.

## Veiligheidseisen voor de bouw

- Een extra scherm is niet voldoende. De server, databasefuncties, opslag en toegangsregels mogen geen trajectgegevens leveren met alleen een wachtwoord als de verplichting aan staat.
- De server controleert het door Supabase uitgegeven beveiligingsniveau van de sessie (`aal2`), niet een waarde uit de browser.
- De instelling staat standaard uit. Een nieuwe versie van de app mag haar niet vanzelf aanzetten.
- Het inschakelen is een gecontroleerde uitrolactie, pas na geslaagde tests voor alle rollen en een geteste herstelprocedure.
- Maak nooit zelf TOTP-codes of geheime sleutels; gebruik de MFA-functies van Supabase Auth.
- Vermeld geen TOTP-geheimen, QR-codes, verificatiecodes of herstelgegevens in logs.
- Bestaande wachtwoordherstel- en uitnodigingsroutes mogen de tweede stap niet omzeilen.

## Controlepunten in de huidige app

- `src/AuthFlow.tsx` en `src/repositories/supabaseAuthRepository.ts`: inloggen, uitnodigingen, sessieherstel en de tweede stap.
- `supabase/functions/session-api/index.ts`: sessie, beheer, antwoorden, trajecten en documenten.
- `supabase/functions/ai-assistant/index.ts`: AI-toegang.
- Databasefuncties voor berichten en hun RLS-regels: directe PostgREST-aanroepen buiten `session-api`.
- Storage-regels voor `participant-documents`: bestanden lopen rechtstreeks via Supabase Storage.
- Alle andere RLS-regels: controleer dat een `aal1`-sessie na inschakeling geen gegevens kan lezen of wijzigen.
- Iedere toekomstige nieuwe tabel met browsertoegang moet naast de eigen RLS-regels ook de beperkende MFA-regel krijgen; de huidige migratie beveiligt de tabellen die op het moment van uitvoeren bestaan.
- Beheerroute: toegang tot algemene instelling en factor-reset, met autorisatie en auditlog.

## Fasen van implementatie

1. **Veilige basis (klaar voor lokale controle):** centrale, standaard uitgeschakelde serverinstelling en herbruikbare AAL2-controle. Geen gebruikersimpact en nog geen inschakelroute.
2. **Koppelen en aanmelden (lokaal gebouwd):** Supabase TOTP-koppeling, QR-code, kopieerbare handmatige sleutel, verificatiecode en herstel van een beveiligde sessie. Nederlandstalige schermen voor bestaande en nieuwe gebruikers.
3. **Gegevens werkelijk afschermen (lokaal gebouwd):** `aal2` afdwingen in session-api, AI, databasefuncties, RLS en Storage. De algemene instelling blijft tijdens de tests uit.
4. **Beheer en herstel (lokaal gebouwd):** uitsluitend voor applicatiebeheerders een bevestigde aan/uit-schakelaar, factor-reset van een andere gebruiker na identiteitscontrole en auditregistratie. Het wissen van de eigen factor via deze route is geblokkeerd.
5. **Test en proefuitrol:** alle rollen, verversen, meerdere tabbladen, verlopen en foutieve codes, telefoonverlies en accountactivatie testen met aparte testaccounts.
6. **Expliciete activering:** pas na akkoord de algemene verplichting aanzetten. Vanaf dat moment moeten bestaande en nieuwe gebruikers een authenticator koppelen.

Bronnen: Supabase MFA-documentatie (https://supabase.com/docs/guides/auth/auth-mfa) en TOTP-uitleg (https://supabase.com/docs/guides/auth/auth-mfa/totp).
