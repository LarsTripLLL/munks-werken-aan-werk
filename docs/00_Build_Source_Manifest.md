# Munks Werkt - leidende bestanden voor de bouw

## Status

Dit document bepaalt welke ontwerpbestanden als bron worden gebruikt bij de bouw van de pilot.

De losse, inhoudelijk beoordeelde reviewsets zijn leidend. Samengestelde totaalreviews zijn alleen bedoeld om schermen naast elkaar te bekijken en mogen niet als bouwspecificatie worden gebruikt.

## Visuele basis

- `Munks-Werkt-visuele-proefset-Inter.html`
  - leidend voor kleur, typografie, logoformaat, kaarten, knoppen, statusbalk, navigatie en zichtbaarheidsmeldingen;
  - de Home-referentie in deze set is leidend voor de algemene uitstraling.

## Account en toegang

- `Munks-Werkt-account-en-inlogroute-review.html`
  - account activeren;
  - privacy en toestemming;
  - inloggen en Face ID.

## Algemene introducties

- `Munks-Werkt-introductieschermen-visuele-review.html`
  - leidend voor de vaste structuur van introductieschermen;
  - berg, route, huidige stap en positie van de hoofdknop.

## Trajectstappen

1. Kennismaken
   - `Munks-Werkt-stap-1-vraagschermen-nieuwe-layout.html`

2. Talententest en resultaten
   - `Munks-Werkt-talententest-en-toestemming-review.html`
   - de talententest duurt ongeveer 60 minuten;
   - de resultaten worden eerst met de begeleider besproken en zijn daarna beschikbaar.

3. Maak je cv
   - `Munks-Werkt-stap-3-cv-schermen-nieuwe-layout.html`

4. Bespreek je cv
   - `Munks-Werkt-stap-4-presentatiereview.html`

5. Werk zoeken en reageren
   - `Munks-Werkt-stap-5-werk-zoeken-nieuwe-layout.html`

6. Een gesprek voorbereiden
   - `Munks-Werkt-stap-6-gesprek-voorbereiden-nieuwe-layout.html`

7. Mogelijkheden en afronding
   - `Munks-Werkt-stap-7-mogelijkheden-afronding-nieuwe-layout.html`

## AI-assistent

- `Munks-Werkt-AI-assistent-review-zelfstandig.html`
  - leidend voor de scope en de gebruikersroutes van de AI-assistent;
  - de AI-assistent ondersteunt het traject en vervangt de begeleider niet;
  - vragen buiten de scope van het traject worden niet beantwoord.

## Dashboards en beheer

- `Munks-Werkt-begeleidersdashboard-concept.html`
- `Munks-Werkt-projectleidersdashboard-concept.html`
- `Munks-Werkt-RSD-dashboard.html`
- `Munks-Werkt-traject-en-deelnemers-beheren.html`

Deze bestanden zijn inhoudelijk richtinggevend. Voor de daadwerkelijke bouw worden rechten en zichtbaarheid ook getoetst aan het databaseontwerp, de privacyverklaring en de toestemmingsverklaring.

## Niet gebruiken als bouwbron

De volgende bestanden zijn samengestelde review- of presentatiedocumenten. Zij kunnen verouderde kopieën van schermen bevatten:

- bestanden met `complete-review`, `totaalreview` of `reviewoverzicht` in de naam;
- `Munks-Werkt-review-met-layout.html`;
- `Munks-Werkt-review-zelfstandig.html`;
- oudere bestanden met `Werken-aan-Werk` in de naam;
- losse experimentele bestanden en afbeeldingen met `test`, `preview` of `voorbeeld` in de naam.

## Regel bij verschillen

Als twee bestanden elkaar tegenspreken, geldt deze volgorde:

1. de nieuwste expliciet goedgekeurde losse reviewset;
2. de UX Specification en Decision Log;
3. de Product Backlog en Product Definition;
4. een samengestelde review uitsluitend ter illustratie.

Bij twijfel wordt eerst een ontwerpbesluit vastgelegd voordat de betreffende functionaliteit wordt gebouwd.
