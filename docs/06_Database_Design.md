# Munks Werkt – Database Design

**Document:** DOC-006  
**Status:** Concept – uitgangspunten deelnemerinvoer en RSD-inzage vastgesteld  
**Doel:** Gegevensmodel voor de pilot van Munks Werkt

## 1. Uitgangspunt

Munks Werkt bestaat uit één vast programma met zeven trajectstappen. Dit programma kan meerdere keren worden uitgevoerd voor verschillende opdrachtgevers, perioden en groepen.

We maken daarom onderscheid tussen:

- **programma:** de vaste opbouw van Munks Werkt;
- **trajectuitvoering:** één concrete groep met een opdrachtgever, begin- en einddatum, begeleiders en deelnemers;
- **deelname:** de koppeling van één deelnemer aan één trajectuitvoering.

## 2. Trajectcode

Iedere trajectuitvoering krijgt een unieke code met deze opbouw:

```text
MW-[OPDRACHTGEVER]-[STARTJAAR]-[VOLGNUMMER]
```

Voorbeelden:

- `MW-RSD-2026-001`
- `MW-RSD-2026-002`
- `MW-GZE-2026-001`

De code verandert niet meer nadat het traject is aangemaakt. Daarnaast krijgt ieder traject een leesbare naam, bijvoorbeeld **Munks Werkt – RSD Zeist – voorjaar 2026**.

## 3. Belangrijkste gegevensgroepen

### Opdrachtgevers

- interne identificatie;
- naam;
- korte code, zoals `RSD`;
- contactpersoon;
- status actief/inactief.

### Trajectuitvoeringen

- interne identificatie;
- unieke trajectcode;
- leesbare naam;
- opdrachtgever;
- startdatum;
- einddatum;
- locatie of regio;
- maximale groepsgrootte;
- projectleider;
- status: concept, gepland, actief, afgerond of geannuleerd;
- datum van aanmaken en laatste wijziging.

### Gebruikers

Voor deelnemers, begeleiders, projectleiders en beheerders wordt één centrale gebruikerstabel gebruikt.

- interne identificatie;
- voornaam en achternaam;
- e-mailadres;
- geboortedatum, alleen waar noodzakelijk;
- rol;
- accountstatus;
- datum laatste activiteit;
- beveiligde inloggegevens of passkeyregistratie.

### Deelnames

Deze gegevens leggen vast dat een persoon deelneemt aan een specifieke trajectuitvoering.

- deelnemer;
- trajectuitvoering;
- toegewezen begeleider;
- datum toegevoegd;
- datum uitnodiging;
- datum accountactivatie;
- status: uitgenodigd, actief, gepauzeerd, gestopt of afgerond;
- reden van stoppen, indien van toepassing;
- doelen behaald: ja, deels, nee of nog niet beoordeeld;
- uitstroomcategorie;
- samenvatting uitstroomadvies.

Een deelnemer kan later aan meer dan één traject deelnemen, zonder dat persoonsgegevens opnieuw hoeven te worden ingevoerd.

### Trajectstappen

De zeven vaste stappen zijn:

1. Kennismaken;
2. Ontdek je talenten;
3. Maak je cv;
4. Bespreek je cv;
5. Werk zoeken en reageren;
6. Bereid een gesprek voor;
7. Bekijk je mogelijkheden.

Per deelname en stap leggen we vast:

- status: nog niet begonnen, bezig, afgerond of overgeslagen;
- datum gestart;
- datum afgerond;
- aanwezigheid bij de bijeenkomst: aanwezig, afwezig of niet van toepassing;
- laatste activiteit.

### Antwoorden en opdrachten

- deelnemer en deelname;
- trajectstap;
- vraag of opdracht;
- antwoord;
- datum opgeslagen;
- datum laatst gewijzigd;
- zichtbaarheid.

Voor de kennismakingsvragen geldt als uitgangspunt dat antwoorden zichtbaar zijn voor de deelnemer en de toegewezen begeleiders, maar nooit automatisch met de groep worden gedeeld.

### RSD-metingen

Per deelname kunnen een begin- en eindmeting worden opgeslagen voor:

- vertrouwen in ondersteuning of dienstverlening;
- vertrouwen in zichzelf;
- motivatie;
- inzicht in toekomstperspectief en realiteitsbesef;
- werknemersvaardigheden.

Iedere score ligt tussen 1 en 10. Ook worden het meetmoment en de datum opgeslagen. Deze gegevens zijn zichtbaar voor de deelnemer, bevoegde begeleiders, projectleider en – binnen de afspraken – de RSD.

### Afspraken en bijeenkomsten

- trajectuitvoering;
- trajectstap;
- datum en tijd;
- locatie;
- type afspraak;
- betrokken begeleider;
- deelnemers;
- aanwezigheid.

### Berichten en hulpvragen

- afzender;
- ontvanger;
- deelname;
- type: bericht of hulpvraag;
- inhoud;
- datum en tijd;
- gelezen ja/nee;
- afgehandeld ja/nee.

### AI-assistent

Voor gesprekken met de AI-assistent leggen we alleen vast wat noodzakelijk is voor de werking en veiligheid.

- deelnemer en deelname;
- actuele trajectstap;
- datum en tijd;
- categorie van de vraag;
- berichtinhoud, alleen als dit binnen de privacyafspraken wordt toegestaan;
- eventuele doorverwijzing naar een begeleider;
- veiligheidsmelding, indien van toepassing.

Vragen buiten de scope van het traject worden niet inhoudelijk beantwoord.

## 4. Rollen en toegangsrechten

### Deelnemer

Ziet uitsluitend:

- de eigen deelname;
- de eigen antwoorden, documenten, afspraken en voortgang;
- berichten die aan hem of haar zijn gericht;
- eigen resultaten van de talententest nadat deze zijn besproken;
- eigen begin- en eindmeting.

### Begeleider

Ziet de deelnemers binnen een trajectuitvoering wanneer hij of zij formeel aan het trajectteam is gekoppeld. Iedere deelnemer heeft daarnaast één primaire begeleider.

Binnen het trajectteam geldt:

- alle gekoppelde begeleiders mogen antwoorden, voortgang, afspraken en praktische trajectinformatie bekijken;
- de primaire begeleider en projectleider mogen persoonlijke begeleidersnotities en het uitstroomadvies wijzigen;
- andere gekoppelde begeleiders mogen praktische informatie aanvullen, maar wijzigen geen persoonlijke begeleidersnotities;
- begeleiders die niet aan de trajectuitvoering zijn gekoppeld, zien de deelnemers niet.

### Projectleider

Ziet alle trajectuitvoeringen waarvoor hij of zij verantwoordelijk is, inclusief groepsvoortgang, deelnemers, metingen en uitstroom.

### Opdrachtgever/RSD

Ziet uitsluitend de gegevens die contractueel en volgens de toestemmings- en privacyafspraken beschikbaar mogen zijn. Het opdrachtgeversdashboard is beperkter dan het interne projectleidersdashboard.

### Beheerder

Kan opdrachtgevers, trajectuitvoeringen, gebruikers en rollen beheren. Toegang tot inhoudelijke antwoorden is niet automatisch nodig voor technisch beheer.

## 5. Belangrijke technische regels

- Iedere tabel gebruikt een interne, niet-herleidbare identificatie.
- De trajectcode is uniek, maar wordt niet als technische sleutel gebruikt.
- Verwijderen gebeurt waar mogelijk eerst door de status op inactief te zetten.
- Wijzigingen in rollen, trajectstatus en belangrijke deelnemergegevens worden gelogd.
- Toegang wordt in de database afgedwongen en niet alleen in het scherm verborgen.
- Persoonsgegevens en inhoudelijke trajectgegevens worden zo veel mogelijk gescheiden.
- Bewaartermijnen worden vóór de pilot vastgesteld en technisch ondersteund.

## 6. Benodigde tabellen voor de pilot

Voor een eerste werkende pilot zijn minimaal nodig:

1. `organizations`
2. `programs`
3. `trajectory_runs`
4. `users`
5. `user_roles`
6. `trajectory_staff`
7. `enrollments`
8. `steps`
9. `enrollment_steps`
10. `questions`
11. `answers`
12. `measurements`
13. `appointments`
14. `attendance`
15. `messages`
16. `documents`
17. `consents`
18. `audit_log`

## 7. Nog te beslissen vóór de bouw

- Hoe lang antwoorden, berichten, AI-gesprekken en documenten worden bewaard.
- Of deelnemers vanuit een bestand geïmporteerd mogen worden.
- Wie een deelname mag pauzeren, stoppen of verwijderen.
- Of een deelnemer met hetzelfde account later aan een nieuw traject kan deelnemen.

## 8. Relatie met de schermen

Dit gegevensmodel ondersteunt:

- de deelnemersapp;
- het begeleidersdashboard;
- het projectleidersdashboard;
- het RSD/opdrachtgeversdashboard;
- traject- en deelnemersbeheer;
- de AI-assistent;
- rapportage over voortgang, aanwezigheid, metingen en uitstroom.

## 9. Vastgesteld: deelnemer toevoegen

Bij het toevoegen van een deelnemer zijn voor de pilot verplicht:

- voornaam;
- achternaam;
- e-mailadres;
- trajectuitvoering;
- toegewezen begeleider;
- intern deelnemernummer of referentienummer van de opdrachtgever;
- keuze om de uitnodiging direct of later te versturen;
- bevestiging dat de deelnemer bij het gekozen traject hoort en dat de invoerder bevoegd is de gegevens vast te leggen.

Alleen indien aantoonbaar nodig worden daarnaast vastgelegd:

- geboortedatum;
- telefoonnummer;
- woonplaats;
- verwijzer of contactpersoon.

De algemene deelnemersregistratie bevat geen BSN, volledig woonadres, kopie van een identiteitsbewijs of medische gegevens.

De bevestiging bij het invoerscherm is een controle door de medewerker en geen algemene toestemming van de deelnemer als juridische grondslag voor alle gegevensverwerking.

## 10. Vastgesteld: inzage RSD op persoonsniveau

Wanneer individuele trajectmonitoring onderdeel is van de afspraken, kan de RSD per deelnemer zien:

- RSD-referentienummer;
- naam, alleen wanneer identificatie voor de uitvoering noodzakelijk en afgesproken is;
- trajectcode;
- gestart ja/nee;
- status per trajectstap;
- aanwezigheid per bijeenkomst;
- traject afgerond ja/nee;
- doelen behaald: ja, deels of nee;
- begin- en eindmeting;
- uitstroomcategorie;
- samenvatting van het uitstroomadvies.

De RSD ziet niet:

- voorbereidende antwoorden;
- het volledige cv;
- de volledige talententestuitslag;
- berichten en hulpvragen;
- gesprekken met de AI-assistent;
- persoonlijke begeleidersnotities;
- zoekopdrachten naar werk of opleidingen.

De definitieve juridische grondslag, verantwoordelijkheidsverdeling en eventuele noodzaak van een DPIA worden vóór de pilot met de opdrachtgever en privacyfunctionaris vastgesteld.

## 11. Vastgesteld: toegang voor begeleiders

Toegang wordt verleend op basis van het trajectteam en niet op basis van het enkele feit dat iemand medewerker van Munks is.

- Iedere trajectuitvoering heeft één projectleider en één of meer gekoppelde begeleiders.
- Iedere deelnemer heeft één primaire begeleider.
- Alle formeel gekoppelde begeleiders mogen de deelnemers binnen hun trajectuitvoering bekijken.
- Alleen de primaire begeleider en projectleider mogen persoonlijke begeleidersnotities en het uitstroomadvies wijzigen.
- Andere gekoppelde begeleiders mogen voortgang, antwoorden en praktische informatie bekijken en praktische gegevens aanvullen.
- Begeleiders buiten de trajectuitvoering hebben geen toegang.
- Technisch beheerders krijgen niet automatisch toegang tot inhoudelijke antwoorden of notities.
- Inzage in gevoelige onderdelen en belangrijke wijzigingen worden vastgelegd in het auditlog.
