# Testplan tweestapsverificatie

## Uitgangspunt

De algemene instelling `mfa_required` blijft tijdens de technische plaatsing op `false`. Daardoor verandert er voor bestaande gebruikers niets. De instelling wordt pas tijdelijk aangezet wanneer minimaal twee applicatiebeheerders beschikbaar zijn en de onderstaande testaccounts klaarstaan.

## Voorbereiding

- Gebruik aparte testaccounts voor een deelnemer, begeleider, opdrachtgever en applicatiebeheerder.
- Zorg voor twee applicatiebeheerders. Zo kan één beheerder de factor van de andere herstellen.
- Installeer op de testtelefoon een authenticator-app.
- Controleer vooraf dat alle testaccounts met alleen het wachtwoord kunnen aanmelden zolang de instelling uit staat.

## Testvolgorde

1. Plaats beide databasemigraties en de twee bijgewerkte serverfuncties terwijl de instelling uit blijft.
2. Publiceer de app en controleer opnieuw het gewone aanmelden, verversen en automatisch uitloggen.
3. Zet tweestapsverificatie aan met het eerste beheerdersaccount.
4. Koppel voor iedere rol de authenticator via de QR-code en controleer ook eenmaal de knop **Kopieer instelsleutel**.
5. Controleer per rol dat pas na de juiste zescijferige code gegevens zichtbaar worden.
6. Controleer een verkeerde code, een verlopen code, verversen, een tweede browsertabblad en opnieuw aanmelden.
7. Laat beheerder 1 na identiteitscontrole de factor van een testgebruiker resetten. Controleer dat bestaande sessies stoppen en dat de gebruiker opnieuw moet koppelen.
8. Controleer dat een beheerder de eigen factor niet via de beheerdersroute kan resetten.
9. Controleer accountactivatie van een nieuwe deelnemer. Na activering moet bij de eerste echte aanmelding de authenticator worden gekoppeld.
10. Test documenten, berichten en AI. Geen van deze onderdelen mag met alleen een wachtwoordsessie gegevens tonen wanneer MFA verplicht is.

## Stopvoorwaarden

Schakel de verplichting direct weer uit met een nog werkend AAL2-beheerdersaccount als een rol niet kan aanmelden, gegevens vóór de tweede stap zichtbaar zijn, herstel niet werkt of verversen onverwacht uitlogt.

## Definitief inschakelen

Pas na een volledig geslaagde testronde wordt besloten of de verplichting voor alle echte gebruikers aan blijft. Informeer gebruikers vooraf dat zij bij hun volgende aanmelding een authenticator-app moeten koppelen en waar zij hulp krijgen bij verlies van hun telefoon.
