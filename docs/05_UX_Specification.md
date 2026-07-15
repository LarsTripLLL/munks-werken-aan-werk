# UX Specification

**Document ID**  
DOC-005

**Project**  
Werken aan Werk

**Versie**  
1.0

**Status**  
Design Ready — inhoudelijke review vereist

**Product Owner**  
Lars van Borssum Waalkes

**Inhoudelijke review**  
Brita

**Laatste wijziging**  
Juli 2026

---

# 1. Doel van dit document

Deze UX Specification beschrijft hoe de digitale ondersteuning van **Werken aan Werk** moet functioneren en aanvoelen voor jongeren en begeleiders.

Het document vertaalt de Product Definition, Decision Log, Product Backlog en User Flows naar concrete uitgangspunten voor:

- wireframes;
- visueel ontwerp in Figma;
- prototyping;
- gebruikerstesten;
- technische ontwikkeling;
- acceptatie van de eerste pilotversie.

De specificatie beschrijft geen definitieve visuele huisstijl. Kleuren, typografie, iconografie en exacte afmetingen worden later vastgelegd in het Design System en het Figma-ontwerp.

---

# 2. Brondocumenten

Deze specificatie is gebaseerd op:

| Document | Relatie met deze specificatie |
|---|---|
| DOC-001 Product Definition | Productvisie, doelgroep, ontwerpprincipes, MVP-scope en succescriteria |
| DOC-002 Decision Log | Vastgelegde product- en ontwerpbeslissingen |
| DOC-003 Product Backlog | Functionaliteiten, stakeholders en prioriteiten |
| DOC-004 User Flows | Gebruikersroutes en gewenste beleving |

Bij een inhoudelijk conflict tussen documenten moet dit eerst worden opgelost via een nieuw besluit in de Decision Log.

---

# 3. Scope van de UX Specification

## 3.1 Binnen deze versie

Deze versie werkt de volgende onderdelen uit:

1. Home;
2. Traject;
3. Trajectstap;
4. Persoonlijke informatie;
5. Mijn omgeving;
6. Dashboard begeleider;
7. globale navigatie;
8. algemene interactie- en contentregels;
9. fout-, laad- en lege toestanden;
10. toegankelijkheid en responsief gedrag.

## 3.2 Berichten: aandachtspunt voor scope

In eerdere ontwerpbesprekingen is **Berichten** opgenomen in de onderste navigatie. De Product Definition plaatst een chatfunctie echter buiten de MVP en de Product Backlog classificeert berichten als toekomstige functionaliteit.

Daarom geldt in deze specificatie:

- de navigatiepositie **Berichten** blijft als ontwerpconcept beschreven;
- een volledige chat- of berichtenfunctie wordt niet als definitief onderdeel van de MVP beschouwd;
- vóór ontwikkeling moet worden besloten of:
  1. Berichten uit de MVP-navigatie wordt verwijderd;
  2. Berichten alleen een eenvoudige contactfunctie wordt;
  3. de MVP-scope wordt uitgebreid met berichten.

Dit is een openstaand scopebesluit en moet vóór de bouw worden vastgelegd in de Decision Log.

## 3.3 Buiten deze versie

Niet uitgewerkt als MVP-functionaliteit:

- AI-ondersteuning;
- vacaturematching;
- uitgebreide pushnotificaties;
- werkgeversportaal;
- externe systeemkoppelingen;
- uitgebreide rapportages;
- geautomatiseerde inhoudelijke adviezen;
- gamification;
- scores, ranglijsten of punten.

---

# 4. Gebruikers

## 4.1 Jongere

Jongeren van 16 tot en met 27 jaar die deelnemen aan Werken aan Werk.

Belangrijke ontwerpkenmerken:

- gebruikt primair een smartphone;
- wil snel begrijpen wat relevant is;
- moet niet afhankelijk zijn van lange instructies;
- wil serieus en gelijkwaardig worden aangesproken;
- moet overzicht, ruimte en perspectief ervaren;
- volgt een gezamenlijke, lineaire trajectopbouw;
- heeft binnen de trajectstappen ruimte voor persoonlijke invulling.

## 4.2 Begeleider

De professional die verantwoordelijk blijft voor het begeleidingsproces.

Belangrijke ontwerpkenmerken:

- heeft snel overzicht nodig;
- wil gesprekken kunnen voorbereiden;
- wil voortgang kunnen volgen zonder overmatige administratie;
- moet kunnen bepalen welke trajectstap actief is;
- moet professionele afwegingen zelf blijven maken;
- gebruikt primair laptop of tablet.

---

# 5. Ontwerpvisie

## 5.1 De app ondersteunt; de begeleider begeleidt

De app ondersteunt informatie, structuur, voorbereiding en communicatie. De app neemt geen inhoudelijke beslissingen over de jongere of het traject.

## 5.2 De route is gezamenlijk; de ontwikkeling is persoonlijk

De hoofdroute is lineair en sluit aan op de groepsbijeenkomsten. Binnen elke stap kan de inhoud persoonlijk zijn.

## 5.3 Structuur geeft ruimte

De interface geeft houvast zonder dwingend of controlerend te worden.

## 5.4 Overzicht geeft rust

De gebruiker ziet alleen wat op dat moment nodig of relevant is.

## 5.5 Perspectief motiveert

De app maakt zichtbaar waar een stap aan bijdraagt en wat erna mogelijk wordt.

## 5.6 Warme, niet-oordelende taal

De app nodigt uit en ondersteunt. De app beoordeelt niet.

Niet:

- Je moet dit vandaag afronden.
- Je loopt achter.
- Opdracht mislukt.
- Je hebt nog niets gedaan.

Wel:

- Hier kun je verder.
- Je volgende stap.
- Dit is nog niet gelukt.
- Wil je hier hulp bij?
- Fijn dat je er bent.

---

# 6. Algemene UX-principes

## 6.1 Mobile first

De jongerenomgeving wordt eerst ontworpen voor een smartphonebreedte van ongeveer 360 tot 430 pixels.

## 6.2 Eén primaire actie per scherm

Elk scherm heeft maximaal één visueel dominante hoofdactie. Andere acties zijn secundair.

## 6.3 Informatiehiërarchie

De volgorde op een scherm volgt het belang voor de gebruiker:

1. wat is nu belangrijk;
2. wat kan ik doen;
3. wat komt eraan;
4. waar vind ik aanvullende informatie.

## 6.4 Voortgang in stappen

Voortgang wordt weergegeven als trajectstappen, niet als percentage, score of ranglijst.

## 6.5 Geen dubbele informatie

Informatie wordt niet onnodig meerdere keren op hetzelfde scherm getoond.

## 6.6 Herkenbaarheid zonder dominantie

De naam of het logo **Werken aan Werk** is zichtbaar voor herkenning. Branding mag de hoofdinhoud niet verdringen. Munks is zichtbaar als afzender op passende plaatsen, zoals onboarding, instellingen of een subtiele aanduiding.

## 6.7 Dynamische inhoud blijft voorspelbaar

Dynamische inhoud mag relevantie vergroten, maar de positie en vorm van onderdelen blijven stabiel. De gebruiker hoeft niet telkens opnieuw te leren waar iets staat.

## 6.8 Begrijpelijke interacties

Knoppen beschrijven de actie:

- Start;
- Verder;
- Bekijk afspraak;
- Open document;
- Vraag hulp;
- Neem contact op.

Vage knoppen zoals *OK*, *Meer* of *Doorgaan* worden alleen gebruikt als de context volledig duidelijk is.

---

# 7. Navigatie

## 7.1 Onderste navigatie voor jongeren

Het vastgestelde navigatieconcept bestaat uit vier onderdelen:

1. Home;
2. Traject;
3. Berichten;
4. Mijn omgeving.

### Gedrag

- de actieve bestemming is visueel herkenbaar;
- ieder onderdeel heeft een icoon en tekstlabel;
- de navigatie blijft op hoofdschermen zichtbaar;
- op verdiepende schermen kan de navigatie tijdelijk worden vervangen door een terugknop;
- het logo is geen vervanging voor Home;
- de gebruiker verliest geen ingevoerde gegevens door per ongeluk van tabblad te wisselen.

### Openstaand punt

De definitieve opname van **Berichten** in de MVP moet worden afgestemd op de vastgestelde MVP-scope.

## 7.2 Navigatie begeleidersomgeving

De begeleidersomgeving gebruikt een aparte desktop- of tabletnavigatie. Minimaal:

- Dashboard;
- Deelnemers;
- Afspraken;
- eventueel Berichten, indien dit onderdeel binnen de scope komt.

De jongeren- en begeleidersomgeving delen geen identieke navigatiestructuur.

## 7.3 Terugnavigatie

- een terugknop brengt de gebruiker naar de vorige logische plek;
- terugnavigatie mag niet leiden tot verlies van ingevulde gegevens zonder waarschuwing;
- de titel van het bovenliggende scherm wordt waar mogelijk vermeld.

---

# 8. Tone of voice

## 8.1 Eigenschappen

De stem van de app is:

- warm;
- duidelijk;
- volwassen;
- kort;
- uitnodigend;
- respectvol;
- niet-oordelend;
- niet gemaakt-jong of overdreven informeel.

## 8.2 Woordkeuze

| Vermijden | Gebruiken |
|---|---|
| Je moet | Je kunt / Hier kun je |
| Dossier | Mijn omgeving / Mijn informatie |
| Assessment | Talententest, wanneer dat inhoudelijk klopt |
| Voltooien | Afronden / Klaar |
| Mislukt | Nog niet gelukt |
| Deadline | Afgesproken vóór / Handig als dit lukt vóór |
| Cliënt / deelnemer in de app | Jij / naam van de jongere |
| Module | Stap |
| Controle | Overzicht |
| Achterstand | Hier kun je verder |

## 8.3 Labels versus herkenbaar gedrag

De app gebruikt zo min mogelijk vaste labels over een persoon.

Liever:

- Je werkt graag samen met anderen.
- Je ontdekt graag nieuwe dingen.
- Je bent graag praktisch bezig.

Niet:

- Sociaal.
- Nieuwsgierig.
- Praktisch.

## 8.4 Tekstlengte

- koppen: bij voorkeur maximaal 6 woorden;
- kaartomschrijving: bij voorkeur maximaal 2 korte zinnen;
- knoptekst: bij voorkeur maximaal 3 woorden;
- langere uitleg wordt opgedeeld in korte blokken;
- belangrijke informatie staat niet alleen in lange lopende tekst.

---

# 9. Feedback en systeemstatus

## 9.1 Succesfeedback

Succesfeedback is rustig en geloofwaardig.

Voorbeelden:

- Deze stap is opgeslagen.
- Mooi, je kunt verder.
- Je antwoord is bewaard.
- Dit onderdeel is klaar.

Geen overmatige confetti, punten of competitie in de MVP.

## 9.2 Waarschuwingen

Waarschuwingen leggen uit wat er gebeurt en wat de gebruiker kan doen.

Voorbeeld:

> Je wijzigingen zijn nog niet opgeslagen. Wil je toch terug?

## 9.3 Foutmeldingen

Een foutmelding bevat:

1. wat er niet is gelukt;
2. indien bekend waarom;
3. wat de gebruiker nu kan doen.

Voorbeeld:

> Opslaan lukt op dit moment niet. Controleer je internetverbinding en probeer het opnieuw.

Niet:

> Fout 500.

## 9.4 Laden

Bij laden:

- blijft de globale schermstructuur herkenbaar;
- wordt een rustige laadindicator gebruikt;
- worden knoppen niet dubbel uitvoerbaar;
- verschijnt na een redelijke wachttijd een duidelijke melding.

## 9.5 Offline of slechte verbinding

Wanneer mogelijk:

- eerder geladen informatie blijft leesbaar;
- invoer wordt tijdelijk lokaal bewaard;
- de gebruiker krijgt te zien dat synchronisatie nog moet plaatsvinden;
- de app belooft niet dat iets is opgeslagen als dat niet bevestigd is.

---

# 10. Lege toestanden

Een lege toestand beschrijft niet alleen dat iets ontbreekt, maar helpt de gebruiker verder.

Voorbeelden:

**Geen afspraak**

> Er staat nu geen nieuwe afspraak gepland. Je begeleider laat het weten zodra er een afspraak is.

**Geen documenten**

> Er staan nog geen documenten in je omgeving.

**Geen bericht**

> Er zijn geen nieuwe berichten.

**Geen opdracht**

> Voor deze stap staat nu geen opdracht klaar.

Lege toestanden zijn neutraal en bevatten geen oordeel.

---

# 11. Toegankelijkheid

De app wordt ontworpen volgens gangbare toegankelijkheidsprincipes.

Minimale eisen:

- voldoende kleurcontrast;
- tekst blijft leesbaar bij vergroting;
- informatie wordt niet uitsluitend met kleur aangegeven;
- interactieve elementen hebben voldoende aanraakoppervlak;
- iconen krijgen een tekstlabel of toegankelijke naam;
- schermen zijn met toetsenbord te bedienen waar relevant;
- focusvolgorde is logisch;
- formulieren hebben zichtbare labels;
- foutmeldingen zijn tekstueel;
- video's krijgen ondertiteling of een tekstalternatief;
- documenten worden waar mogelijk toegankelijk aangeleverd;
- animaties zijn beperkt en niet noodzakelijk om informatie te begrijpen.

Doelstelling voor ontwikkeling: aansluiting bij **WCAG 2.2 niveau AA**, voor zover technisch en organisatorisch haalbaar binnen de pilot.

---

# 12. Privacy en gegevensbeleving

Deze UX Specification bepaalt niet de juridische of technische privacyarchitectuur, maar stelt de volgende gebruikersprincipes vast:

- alleen informatie tonen die de gebruiker nodig heeft;
- duidelijk maken welke gegevens zichtbaar zijn voor de begeleider;
- gevoelige gegevens niet onnodig op Home tonen;
- geen medische of vertrouwelijke notities zichtbaar maken zonder expliciete functionele noodzaak en passende autorisatie;
- uitloggen is vindbaar in Mijn omgeving;
- persoonlijke gegevens worden niet als marketingprofiel gepresenteerd;
- begeleiders zien uitsluitend deelnemers waarvoor zij bevoegd zijn.

---

# 13. UX001 – Home

## 13.1 Doel

De jongere binnen enkele seconden laten zien:

- dat hij of zij in Werken aan Werk is;
- wat nu de relevante volgende stap is;
- wanneer de eerstvolgende afspraak is;
- hoe aanvullende informatie bereikbaar is.

## 13.2 Doelgroep

Jongere.

## 13.3 Gerelateerd aan

- PB001 Home;
- UF001 Start van de app;
- D001 Communicatie van de doelgroep;
- D005 Overzicht geeft rust;
- D009 Dynamische snelkoppelingen;
- D010 Geen voortgang in percentages;
- D013 Herkenbare identiteit;
- D014 Mijn omgeving.

## 13.4 Gewenste beleving

> Fijn dat je er bent. Ik zie meteen wat voor mij nu belangrijk is.

## 13.5 Informatiehiërarchie

Van boven naar beneden:

1. herkenning Werken aan Werk;
2. dynamische welkomsttekst;
3. kaart **Je volgende stap**;
4. eerstvolgende afspraak;
5. dynamische snelkoppelingen;
6. eventueel een relevant bericht;
7. onderste navigatie.

## 13.6 Header

De header bevat:

- naam of compact logo van Werken aan Werk;
- eventueel een klein status- of accounticoon wanneer functioneel nodig.

Het logo is herkenbaar maar compact. De persoonlijke inhoud blijft dominant.

## 13.7 Dynamische welkomsttekst

Bij een nieuwe gebruikerssessie wordt één tekst gekozen uit een centraal beheerde set.

Regels:

- dezelfde tekst wordt niet twee sessies achter elkaar getoond;
- de tekst blijft gedurende de sessie gelijk;
- maximaal één korte zin;
- warm en niet-oordelend;
- niet afhankelijk van een prestatie die niet betrouwbaar is vastgesteld.

Initiële teksten:

1. Fijn dat je er bent.
2. Welkom terug.
3. Mooi dat je weer even kijkt.
4. Klaar om verder te kijken?
5. Vandaag kun je weer een stap zetten.
6. Neem rustig de tijd om verder te gaan.

De tekst *Goed dat je er bent* wordt niet gebruikt, omdat deze als normatief kan worden ervaren.

## 13.8 Kaart Je volgende stap

De hoofdkaart bevat:

- label **Je volgende stap**;
- titel van de actuele activiteit;
- korte uitleg waarom deze stap relevant is;
- tijdsindicatie indien betrouwbaar;
- één primaire knop.

Voorbeeld:

> **Je volgende stap**  
> Ontdek wat bij je past  
> Deze stap helpt je om te zien welk werk of welke opleiding bij jou kan passen.  
> Ongeveer 20 minuten  
> **Start**

### Gedrag

- de kaart verwijst naar de actuele trajectstap of opdracht;
- als geen activiteit klaarstaat, wordt een neutrale lege toestand getoond;
- de begeleider of trajectplanning bepaalt welke stap actief is;
- de app kiest niet zelfstandig een andere inhoudelijke stap.

## 13.9 Eerstvolgende afspraak

De afspraakkaart bevat:

- datum;
- start- en eindtijd;
- type afspraak of bijeenkomst;
- naam begeleider indien relevant;
- locatie of online aanduiding;
- knop **Bekijk afspraak**.

Op Home wordt alleen de eerstvolgende relevante afspraak getoond.

## 13.10 Dynamische snelkoppelingen

Maximaal vier snelkoppelingen.

De snelkoppelingen worden bepaald door de actuele trajectfase. Voorbeelden:

- Wat bij mij past;
- Mijn documenten;
- Mijn afspraken;
- Mijn doelen;
- Mijn cv, wanneer dit binnen een actuele trajectstap relevant is.

Regels:

- positie van het snelkoppelingsblok blijft stabiel;
- labels zijn kort;
- snelkoppelingen dupliceren niet de primaire hoofdactie;
- alleen onderdelen tonen die beschikbaar zijn.

## 13.11 Bericht van begeleider

Een berichtkaart is alleen zichtbaar als er een nieuw of specifiek relevant bericht is.

De kaart bevat:

- afzender;
- korte preview;
- datum of relatieve tijd;
- actie **Lees bericht** of **Bekijk**.

Wanneer Berichten niet binnen de MVP valt, kan dit onderdeel worden vervangen door een informatieve begeleidersnotitie zonder gespreksoverzicht. Dit moet vóór ontwikkeling worden besloten.

## 13.12 Interacties

- primaire kaart openen;
- afspraak openen;
- snelkoppeling openen;
- eventueel bericht openen;
- via onderste navigatie naar andere hoofdonderdelen gaan.

## 13.13 Laadtoestand

Bij laden worden vaste placeholders gebruikt voor:

- welkomsttekst;
- hoofdkaart;
- afspraak;
- snelkoppelingen.

De navigatie blijft zichtbaar.

## 13.14 Lege toestanden

**Geen actuele stap**

> Er staat nu geen nieuwe stap klaar. Je begeleider laat het weten zodra je verder kunt.

**Geen afspraak**

> Er staat nu geen nieuwe afspraak gepland.

**Geen snelkoppelingen**

Het hele blok wordt verborgen; geen lege kaart tonen.

## 13.15 Foutsituaties

**Home kan niet worden geladen**

> Je overzicht kan nu niet worden geladen. Probeer het opnieuw.

Acties:

- Opnieuw proberen;
- eventueel Contact opnemen.

## 13.16 Succescriteria

Tijdens een gebruikerstest kan de jongere zonder uitleg:

- binnen vijf seconden de volgende stap aanwijzen;
- de eerstvolgende afspraak vinden;
- uitleggen waar Traject staat;
- uitleggen waar persoonlijke informatie staat;
- de primaire actie starten;
- herkennen dat de omgeving bij Werken aan Werk hoort.

## 13.17 Openstaande ontwerpvragen

- Komt Berichten definitief in de MVP-navigatie?
- Wordt de naam van de jongere op Home gebruikt of blijft de welkomsttekst naamloos?
- Welke vier snelkoppelingen horen bij iedere trajectfase?
- Welke huisstijlelementen van Munks worden subtiel opgenomen?

---

# 14. UX002 – Traject

## 14.1 Doel

De jongere inzicht geven in de gezamenlijke, lineaire route van Werken aan Werk en duidelijk maken welke stap actueel is.

## 14.2 Doelgroep

Jongere.

## 14.3 Gerelateerd aan

- PB002 Trajectoverzicht;
- UF002 Traject bekijken;
- D003 Gezamenlijke route;
- D004 Structuur geeft ruimte;
- D008 Lineaire opbouw;
- D010 Geen percentages.

## 14.4 Gewenste beleving

> Ik begrijp hoe het traject is opgebouwd, waar ik nu ben en wat later komt.

## 14.5 Inhoud

- titel **Traject**;
- korte uitleg indien nodig;
- alle trajectstappen in vaste volgorde;
- actuele stap;
- afgeronde stappen;
- toekomstige stappen;
- eventuele datum of bijeenkomst per stap.

## 14.6 Weergave

Voorkeursrichting voor mobiel: een verticale route of tijdlijn.

Iedere stap toont minimaal:

- stapnummer;
- korte titel;
- status;
- eventueel korte ondertitel.

Statussen:

- klaar;
- nu;
- later.

Vermijd systeemtermen zoals *open*, *locked*, *completed* in de gebruikersinterface.

## 14.7 Toegang tot stappen

- de actuele stap is volledig toegankelijk;
- afgeronde stappen kunnen worden teruggekeken;
- toekomstige stappen mogen zichtbaar zijn om perspectief te geven;
- toekomstige inhoud kan beperkt of alleen als vooruitblik toegankelijk zijn;
- de begeleider bepaalt wanneer een stap actief wordt.

## 14.8 Interacties

- actuele stap openen;
- afgeronde stap terugkijken;
- toekomstige stap bekijken als vooruitblik, wanneer toegestaan.

## 14.9 Lege en bijzondere toestanden

**Traject nog niet gestart**

> Jouw route wordt binnenkort samen met je begeleider gestart.

**Tijdelijk geen actieve stap**

> Je hebt deze stap afgerond. Je begeleider laat weten wanneer de volgende stap begint.

## 14.10 Foutsituatie

> Je traject kan nu niet worden geladen. Probeer het opnieuw.

## 14.11 Succescriteria

De jongere kan zonder uitleg:

- de actuele stap aanwijzen;
- zien welke stappen klaar zijn;
- zien welke stappen later komen;
- een afgeronde stap openen;
- uitleggen dat het traject uit een vaste gezamenlijke route bestaat.

## 14.12 Ontwerpuitgangspunten

- geen percentages;
- geen competitie;
- toekomstige stappen geven perspectief maar geen druk;
- status is niet alleen met kleur herkenbaar;
- maximaal noodzakelijke tekst per stap.

## 14.13 Openstaande ontwerpvragen

- Hoeveel trajectstappen zijn definitief?
- Welke stapnamen worden gebruikt?
- Mag een jongere toekomstige stapinhoud volledig openen?
- Kan een stap meerdere groepsbijeenkomsten beslaan?

---

# 15. UX003 – Trajectstap

## 15.1 Doel

De jongere ondersteunen bij de inhoud en activiteiten van de actuele trajectstap.

## 15.2 Doelgroep

Jongere.

## 15.3 Gerelateerd aan

- PB003 Trajectstap;
- UF003 Werken aan een trajectstap;
- D003 Persoonlijke ontwikkeling binnen gezamenlijke route;
- D005 Overzicht geeft rust;
- D007 Eenvoud;
- D008 Lineaire opbouw.

## 15.4 Gewenste beleving

> Ik begrijp waarom deze stap belangrijk is en weet wat ik nu kan doen.

## 15.5 Opbouw

Een trajectstap bevat, indien relevant:

1. titel en stapnummer;
2. korte uitleg;
3. waarom deze stap helpt;
4. beschikbare activiteiten of opdrachten;
5. documenten of video;
6. reflectie;
7. voortgang binnen de stap;
8. hulpoptie.

Niet ieder onderdeel is verplicht. Alleen relevante onderdelen worden getoond.

## 15.6 Activiteiten en opdrachten

Iedere opdrachtkaart bevat:

- titel;
- korte uitleg;
- geschatte duur indien betrouwbaar;
- status;
- actie.

Mogelijke statussen in gewone taal:

- Hier kun je beginnen;
- Bezig;
- Klaar;
- Bespreek met je begeleider.

## 15.7 Eén taak tegelijk

Als een opdracht meerdere onderdelen heeft:

- presenteer deze in kleine delen;
- toon één duidelijke primaire actie;
- laat voortgang binnen een formulier zien zonder prestatiepercentage;
- bewaar tussentijdse invoer.

## 15.8 Afronding

Een jongere kan een activiteit afronden wanneer dit inhoudelijk passend is. De trajectstap zelf wordt niet automatisch inhoudelijk goedgekeurd wanneer professionele beoordeling nodig is.

Mogelijke situaties:

- jongere markeert opdracht als klaar;
- begeleider bespreekt of bevestigt de stap;
- systeem registreert technisch dat alle onderdelen zijn ingevuld.

De interface moet duidelijk onderscheiden tussen:

- **ingevuld door de jongere**;
- **besproken met de begeleider**;
- **stap afgesloten**.

## 15.9 Hulp

Op iedere opdracht is een laagdrempelige hulpactie beschikbaar.

Voorbeelden:

- Ik begrijp dit niet;
- Ik wil dit bespreken;
- Hulp bij deze opdracht.

De hulpactie vervangt geen nood- of crisisvoorziening.

## 15.10 Documenten en video

Document:

- herkenbare titel;
- bestandstype;
- grootte indien relevant;
- openen of downloaden.

Video:

- ondertiteling;
- duur;
- tekstalternatief of samenvatting;
- geen automatisch afspelen met geluid.

## 15.11 Invoer en opslag

- antwoorden worden automatisch of expliciet opgeslagen;
- de opslagstatus is zichtbaar;
- bij lange formulieren blijft invoer bewaard;
- verplichte velden zijn beperkt tot wat noodzakelijk is;
- de app legt uit waarom informatie nodig is indien dat niet vanzelfsprekend is.

## 15.12 Lege toestand

> Voor deze stap staat nu geen opdracht klaar. Je kunt de uitleg alvast bekijken.

## 15.13 Foutmeldingen

**Opslaan niet gelukt**

> Je antwoord is nog niet opgeslagen. Probeer het opnieuw.

**Bestand niet beschikbaar**

> Dit document kan nu niet worden geopend. Vraag je begeleider om hulp als het later nog niet lukt.

## 15.14 Succescriteria

De jongere kan:

- uitleggen wat het doel van de stap is;
- de eerstvolgende activiteit vinden;
- een opdracht starten;
- tussentijds stoppen zonder invoer te verliezen;
- hulp vragen;
- zien wat klaar is en wat nog openstaat.

## 15.15 Ontwerpuitgangspunten

- één hoofdactie;
- korte inhoudsblokken;
- waarom vóór uitgebreide instructie;
- geen lange schoolse pagina;
- geen rode beoordelingssignalen;
- positieve en feitelijke afronding.

## 15.16 Openstaande ontwerpvragen

- Welke trajectstappen vereisen bevestiging van de begeleider?
- Welke antwoorden mogen later worden aangepast?
- Welke bestandstypen worden ondersteund?
- Hoe wordt de talententest gekoppeld zonder externe systeemkoppeling?

---

# 16. UX004 – Persoonlijke informatie

## 16.1 Doel

Persoonlijke, trajectgerelateerde informatie overzichtelijk bijeenbrengen.

## 16.2 Positie in de informatiearchitectuur

**Persoonlijke informatie** is een functioneel begrip uit de Backlog en User Flows. In de uiteindelijke app is dit waarschijnlijk geen zelfstandig hoofdtabblad, maar een verzameling onderdelen binnen **Mijn omgeving** en relevante snelkoppelingen op Home.

## 16.3 Doelgroep

Jongere.

## 16.4 Gerelateerd aan

- PB004 Persoonlijke informatie;
- UF004 Persoonlijke informatie bekijken;
- D011 Functionele benamingen;
- D012 Geen dossier;
- D014 Mijn omgeving.

## 16.5 Gewenste beleving

> Mijn afspraken, documenten en opdrachten zijn gemakkelijk terug te vinden.

## 16.6 Onderdelen

- afspraken;
- documenten;
- opdrachten;
- trajectinformatie;
- eventueel afgeronde resultaten die voor de jongere relevant zijn.

## 16.7 Organisatie

Informatie wordt per type gegroepeerd, niet als één lange gemengde lijst.

Iedere groep toont:

- duidelijke titel;
- meest recente of relevante items;
- actie **Bekijk alles** indien nodig.

## 16.8 Zoeken en filteren

Niet noodzakelijk voor een kleine pilotgroep of beperkt aantal items. Toevoegen wanneer het volume dit rechtvaardigt.

## 16.9 Documenten

Per document:

- begrijpelijke titel;
- datum;
- afzender of context;
- bestandstype;
- openen/downloaden.

Interne systeemnamen of technische bestandsnamen worden niet aan de jongere getoond.

## 16.10 Afspraken

Afspraken worden chronologisch getoond, met komende afspraken vóór historische afspraken.

## 16.11 Opdrachten

Opdrachten kunnen worden gegroepeerd als:

- hier kun je verder;
- klaar;
- later.

## 16.12 Lege toestanden

**Geen documenten**

> Er staan nog geen documenten in jouw omgeving.

**Geen afspraken**

> Er staat nu geen afspraak gepland.

**Geen open opdrachten**

> Er staan nu geen open opdrachten klaar.

## 16.13 Succescriteria

De jongere kan:

- een afspraak terugvinden;
- een document openen;
- een open opdracht vinden;
- onderscheid zien tussen actuele en afgeronde informatie.

## 16.14 Openstaande ontwerpvraag

Wordt Persoonlijke informatie als afzonderlijk scherm ontworpen, of uitsluitend als onderdelen binnen Mijn omgeving? Voor de eerste wireframes wordt uitgegaan van integratie binnen Mijn omgeving.

---

# 17. UX005 – Mijn omgeving

## 17.1 Doel

Een herkenbare persoonlijke hub bieden voor alles wat bij het traject van de jongere hoort.

## 17.2 Doelgroep

Jongere.

## 17.3 Gerelateerd aan

- PB004 Persoonlijke informatie;
- PB005 Persoonlijk profiel;
- UF004 en UF005;
- D012 Geen dossier;
- D014 Mijn omgeving.

## 17.4 Gewenste beleving

> Hier vind ik alles wat bij mijn traject en mijn keuzes hoort.

## 17.5 Inhoud

Mijn omgeving bevat tegels of secties voor:

- Mijn doelen;
- Wat bij mij past;
- Mijn documenten;
- Mijn afspraken;
- Mijn opdrachten, indien niet elders voldoende bereikbaar;
- Mijn begeleider;
- Contact;
- Instellingen.

Persoonsgegevens worden alleen getoond waar zij functioneel nodig zijn en vormen niet het belangrijkste onderdeel.

## 17.6 Header

Mogelijke opbouw:

- titel **Mijn omgeving**;
- naam van de jongere, zonder overbodige begroeting;
- eventueel profielfoto of initialen, alleen wanneer dit waarde toevoegt.

Geen tekst als *Hoi Sam* op dit scherm, omdat de gebruiker zich niet aan zichzelf hoeft voor te stellen.

## 17.7 Mijn doelen

Toont de actuele persoonlijke doelen in herkenbare taal.

Voorbeeld:

> Ik wil ontdekken welk werk bij mij past.

De begeleider en jongere bepalen de inhoud samen. De app genereert geen zelfstandig doel.

## 17.8 Wat bij mij past

Toont herkenbaar gedrag en voorkeuren in plaats van beperkende labels.

Voorbeelden:

- Praktisch bezig zijn;
- Samenwerken;
- Nieuwe dingen ontdekken;
- Afwisseling in het werk.

## 17.9 Mijn begeleider

Bevat:

- naam;
- rol;
- contactmogelijkheden die binnen de scope beschikbaar zijn;
- eventueel eerstvolgende afspraak.

## 17.10 Instellingen

Minimaal:

- accountgegevens;
- toegankelijkheids- of meldingsvoorkeuren indien beschikbaar;
- privacy-informatie;
- uitloggen.

Instellingen staan onderaan en domineren de persoonlijke inhoud niet.

## 17.11 Interacties

- onderdeel openen;
- document openen;
- afspraak bekijken;
- contact opnemen;
- instellingen openen;
- uitloggen.

## 17.12 Lege toestanden

**Geen doel vastgelegd**

> Jouw doel is nog niet ingevuld. Je kunt dit samen met je begeleider bespreken.

**Geen informatie bij Wat bij mij past**

> Dit onderdeel wordt tijdens het traject samen met jou aangevuld.

## 17.13 Succescriteria

De jongere kan zonder uitleg:

- documenten vinden;
- afspraken vinden;
- het persoonlijke doel vinden;
- zien wie de begeleider is;
- contactmogelijkheden vinden;
- uitloggen.

## 17.14 Ontwerpuitgangspunten

- persoonlijke hub, geen administratief dossier;
- logische groepering;
- geen onnodige herhaling van persoonsgegevens;
- menselijke benamingen;
- uitbreidbaar zonder nieuwe hoofdtabbladen.

## 17.15 Openstaande ontwerpvragen

- Wordt een profielfoto gebruikt?
- Kan de jongere bepaalde gegevens zelf wijzigen?
- Wie beheert doelen en informatie bij Wat bij mij past?
- Welke privacytekst is nodig bij gedeelde informatie?

---

# 18. UX006 – Dashboard begeleider

## 18.1 Doel

Begeleiders snel inzicht geven in deelnemers, actuele trajectstappen, openstaande activiteiten en afspraken, zodat zij gericht kunnen begeleiden.

## 18.2 Doelgroep

Begeleider.

## 18.3 Gerelateerd aan

- PB006 Begeleidersdashboard;
- UF006 Begeleider volgt voortgang;
- D002 Verantwoordelijkheid begeleider;
- D003 Gezamenlijke route;
- D008 Lineaire opbouw.

## 18.4 Gewenste beleving

> Ik zie snel wie mijn aandacht nodig heeft en kan een gesprek goed voorbereiden.

## 18.5 Platform

Primair ontworpen voor laptop en tablet. Een mobiele weergave mag basisinformatie tonen, maar is niet leidend voor complexe beheerhandelingen.

## 18.6 Dashboardoverzicht

Minimaal:

- groeps- of deelnemersoverzicht;
- actuele trajectstap per jongere;
- openstaande opdrachten;
- komende afspraken;
- recente activiteit;
- hulpvraag of relevante signalering, indien binnen scope.

## 18.7 Prioritering

Het dashboard geeft geen geautomatiseerd inhoudelijk oordeel over de jongere.

Signaleringen zijn feitelijk, bijvoorbeeld:

- hulp gevraagd;
- opdracht nog open;
- afspraak vandaag;
- vier dagen geen geregistreerde activiteit.

Vermijd onverklaarde rode risicoscores.

## 18.8 Deelnemerslijst

Per rij of kaart:

- naam;
- actuele stap;
- eerstvolgende afspraak;
- openstaande actie;
- laatste relevante activiteit.

Filters kunnen zijn:

- groep;
- actuele stap;
- hulpvraag;
- afspraakdatum.

## 18.9 Deelnemerdetail

Vanuit het dashboard opent de begeleider een deelnemer. Minimaal zichtbaar:

- actuele trajectstap;
- opdrachten en statussen;
- afspraken;
- persoonlijke doelen;
- Wat bij mij past;
- contactgegevens;
- relevante documenten.

Interne begeleidersnotities moeten duidelijk worden gescheiden van informatie die de jongere zelf ziet.

## 18.10 Bevoegdheden

De begeleider kan, afhankelijk van rol en technische uitwerking:

- trajectstap activeren;
- afspraak toevoegen of wijzigen;
- opdracht klaarzetten;
- voortgang bekijken;
- doel of persoonlijke informatie aanvullen;
- reageren op hulpvraag.

Alleen bevoegdheden die noodzakelijk zijn worden toegekend.

## 18.11 Lege toestanden

**Geen deelnemers**

> Er zijn nog geen deelnemers aan deze groep toegevoegd.

**Geen afspraken**

> Er staan geen afspraken gepland.

**Geen openstaande acties**

> Er zijn nu geen openstaande acties.

## 18.12 Foutmeldingen

**Wijziging niet opgeslagen**

> De wijziging is niet opgeslagen. Probeer het opnieuw.

Bij risicovolle wijzigingen wordt duidelijk gemaakt of de jongere hiervan een melding krijgt.

## 18.13 Succescriteria

De begeleider kan:

- binnen tien seconden de actuele situatie van een groep overzien;
- een specifieke deelnemer openen;
- de huidige trajectstap vinden;
- openstaande opdrachten zien;
- de eerstvolgende afspraak vinden;
- feitelijke hulpvragen herkennen;
- onderscheiden welke informatie zichtbaar is voor de jongere.

## 18.14 Ontwerpuitgangspunten

- overzicht vóór detail;
- feitelijke signaleringen;
- geen ondoorzichtige algoritmische beoordeling;
- acties dichtbij de relevante informatie;
- duidelijke scheiding tussen gedeelde en interne informatie;
- minimale administratieve belasting.

## 18.15 Openstaande ontwerpvragen

- Welke rollen en rechten bestaan er?
- Zijn er meerdere groepen tegelijk?
- Welke informatie mag een begeleider wijzigen?
- Krijgt de opdrachtgever een aparte omgeving?
- Welke rapportage is minimaal nodig voor de pilot?

---

# 19. Berichten en contact

## 19.1 Scopevoorbehoud

Een volledige berichtenfunctie is nog niet definitief onderdeel van de MVP. Onderstaande specificatie is een ontwerpkader indien Berichten wordt opgenomen.

## 19.2 Doel

Laagdrempelig contact ondersteunen zonder de begeleidingsrelatie te vervangen.

## 19.3 Minimale variant

Een eenvoudige variant kan bestaan uit:

- contactopties;
- hulpvraag met vaste onderwerpen;
- begeleidersbericht lezen;
- geen realtime chat.

## 19.4 Volledige variant

Een uitgebreide variant kan bestaan uit:

- gespreksoverzicht;
- tekstberichten;
- leesstatus;
- notificaties;
- bijlagen, alleen indien noodzakelijk en veilig.

## 19.5 Hulpvraag

Vaste keuzes kunnen zijn:

- Ik begrijp de opdracht niet;
- Ik kan niet naar mijn afspraak komen;
- Ik wil mijn begeleider spreken;
- Ik wil hulp bij mijn cv;
- Anders.

Daarna kan de jongere optioneel toelichting geven.

## 19.6 Veiligheid

- geen belofte van directe reactie als die niet gegarandeerd is;
- responstijd duidelijk communiceren;
- bij urgente situaties verwijzen naar de juiste bestaande route;
- geen crisisfunctionaliteit suggereren.

## 19.7 Openstaand besluit

Voor de wireframes moet eerst worden gekozen welke variant onderdeel is van de MVP.

---

# 20. Responsief gedrag

## 20.1 Jongerenomgeving

- één kolom op mobiel;
- kaarten onder elkaar;
- onderste navigatie vast of goed bereikbaar;
- geen horizontaal scrollen voor primaire inhoud;
- formulieren passen zich aan schermbreedte aan;
- belangrijke knoppen blijven bereikbaar zonder precisieklik.

## 20.2 Tablet

- meer witruimte;
- eventueel twee kolommen voor secundaire kaarten;
- primaire inhoud blijft linksboven beginnen;
- geen extra informatie alleen omdat er ruimte is.

## 20.3 Begeleidersdashboard

- desktop: tabel of combinatie van lijst en detail;
- tablet: compacte lijst en apart detailscherm;
- mobiel: alleen kerninformatie en eenvoudige acties.

---

# 21. Formulieren

## 21.1 Algemene regels

- zichtbaar label boven ieder veld;
- voorbeeldtekst is geen vervanging voor een label;
- alleen noodzakelijke gegevens verplicht;
- foutmelding bij het relevante veld;
- invoer blijft behouden bij fout;
- logische toetsenbordtypes op mobiel;
- datum niet alleen als vrije tekst;
- duidelijke opslagstatus.

## 21.2 Reflectievragen

Reflectievragen:

- één vraag per blok;
- eenvoudige taal;
- antwoord overslaan waar inhoudelijk toegestaan;
- uitleg waarom een antwoord wordt gevraagd;
- geen beoordeling van vrije tekst door de app.

---

# 22. Notificaties en herinneringen

Pushnotificaties staan buiten de huidige MVP-scope. Indien later toegevoegd:

- alleen relevante herinneringen;
- gebruiker kan voorkeuren beheren;
- geen beschamende of gevoelige tekst op vergrendelscherm;
- geen overmatige frequentie;
- afspraakherinneringen vermelden duidelijk datum en tijd;
- notificatie leidt direct naar relevante inhoud.

In-app meldingen mogen wel worden gebruikt voor actuele status of foutfeedback.

---

# 23. Analytics en gebruiksmeting

Indien gebruiksmeting wordt toegepast, wordt alleen gemeten wat nodig is om de pilot te evalueren.

Mogelijke gebeurtenissen:

- Home geopend;
- trajectstap geopend;
- opdracht gestart;
- opdracht technisch afgerond;
- afspraak bekeken;
- hulp gevraagd.

Niet gebruiken voor verborgen profiling of automatische inhoudelijke beoordeling.

Gebruikers worden passend geïnformeerd over gegevensverwerking.

---

# 24. Acceptatiecriteria voor Design Ready

De UX Specification is Design Ready wanneer:

- alle MVP-hoofdonderdelen zijn beschreven;
- openstaande scopebesluiten expliciet zijn gemarkeerd;
- schermdoelen en informatiehiërarchie duidelijk zijn;
- lege, laad- en foutsituaties zijn beschreven;
- toegankelijkheidseisen zijn opgenomen;
- terminologie consistent is;
- de relaties met Backlog en User Flows zijn vastgelegd;
- Lars en Brita de inhoud hebben beoordeeld.

Na review kunnen wireframes worden gemaakt. Openstaande vragen mogen in de wireframefase worden onderzocht, zolang zij de MVP-scope niet stilzwijgend wijzigen.

---

# 25. Openstaande besluiten vóór ontwikkeling

| Nr. | Onderwerp | Benodigde beslissing |
|---|---|---|
| O001 | Berichten | Niet in MVP, eenvoudige contactvariant of volledige berichtenfunctie |
| O002 | Trajectstappen | Definitief aantal, titels en inhoud |
| O003 | Persoonlijke informatie | Zelfstandig scherm of volledig geïntegreerd in Mijn omgeving |
| O004 | Afronding stap | Wie kan een stap technisch en inhoudelijk afsluiten |
| O005 | Rollen en rechten | Exacte bevoegdheden per begeleidersrol |
| O006 | Branding | Logo, naamgebruik en relatie met Munks |
| O007 | Persoonsgegevens | Welke gegevens de jongere zelf kan bekijken en wijzigen |
| O008 | Begeleidersnotities | Welke informatie intern blijft en welke gedeeld wordt |
| O009 | Afspraken | Handmatig beheer of latere kalenderkoppeling |
| O010 | Talententest | Handmatige invoer, documentupload of externe koppeling in latere fase |

Deze punten worden tijdens wireframing en functionele uitwerking besloten en indien nodig toegevoegd aan de Decision Log.

---

# Reviewstatus

| Reviewer | Status | Datum | Opmerking |
|---|---|---|---|
| Lars van Borssum Waalkes | Gereed voor review |  |  |
| Brita | Gereed voor review |  |  |

---

# Wijzigingshistorie

| Versie | Datum | Wijziging |
|---|---|---|
| 0.1 | Juli 2026 | Eerste conceptversie met globale schermbeschrijvingen. |
| 0.2 | Juli 2026 | Dynamische welkomsttekst en gewenste beleving toegevoegd. |
| 0.3 | Juli 2026 | Home, Mijn omgeving en navigatie bijgewerkt. |
| 1.0 | Juli 2026 | Volledige Design Ready-specificatie opgesteld op basis van DOC-001 t/m DOC-004. |

---

# GitHub

**Doelbestandsnaam**

`docs/05_UX_Specification.md`

**Commit message**

`Finalize UX Specification v1.0`

**Commit description**

```text
Finalize the UX Specification for the design phase.

Changes:
- Expanded all MVP user experiences and screen specifications
- Added navigation, tone of voice and accessibility principles
- Added loading, empty and error states
- Added responsive and form behavior
- Defined success and acceptance criteria
- Documented open scope decisions before development
- Aligned the specification with Product Definition, Decision Log, Product Backlog and User Flows
```
