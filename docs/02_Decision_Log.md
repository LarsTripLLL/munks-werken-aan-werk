# Decision Log

**Document ID**\
DOC-002

**Project**\
Werken aan Werk

**Versie**\
0.5

**Status**\
Concept

**Auteur**\
OpenAI ChatGPT

**Product Owner**\
Lars van Borssum Waalkes

**Inhoudelijke review**\
Brita

**Laatste wijziging**\
Augustus 2026

------------------------------------------------------------------------

# Doel

In de Decision Log worden de belangrijkste product- en
ontwerpbeslissingen vastgelegd. Iedere beslissing beschrijft de
aanleiding, het besluit, de impact en de relatie met andere
projectdocumenten.

------------------------------------------------------------------------

# Productvisie

## D001 -- De app sluit aan bij de communicatie van de doelgroep

**Aanleiding**\
Jongeren communiceren en vinden informatie vooral via hun smartphone.

**Besluit**\
Werken aan Werk wordt ondersteund door een app die aansluit bij de
huidige communicatievormen en informatiebehoefte van jongeren.

**Impact**\
De app ondersteunt het traject tussen groepsbijeenkomsten en individuele
gesprekken.

------------------------------------------------------------------------

## D002 -- De begeleider blijft verantwoordelijk voor de begeleiding

**Aanleiding**\
Begeleiding vraagt om professionele afwegingen.

**Besluit**\
De app ondersteunt het begeleidingsproces. De begeleider blijft
verantwoordelijk voor de begeleiding, terwijl de jongere wordt
gestimuleerd om zelf stappen te zetten.

**Impact**\
De app ondersteunt en vervangt de begeleiding niet.

------------------------------------------------------------------------

## D003 -- De route is gezamenlijk, de ontwikkeling is persoonlijk

Iedere deelnemer volgt dezelfde route, met ruimte voor persoonlijke
invulling.

------------------------------------------------------------------------

# Gebruikerservaring

## D004 -- Structuur geeft ruimte

Een duidelijke structuur biedt houvast en ruimte voor eigen keuzes.

## D005 -- Overzicht geeft rust

Alleen relevante informatie wordt getoond.

## D006 -- Perspectief motiveert

Iedere stap draagt bij aan een positief toekomstperspectief.

## D007 -- Eenvoud in taal en ontwerp

De app gebruikt eenvoudige taal en een rustige vormgeving.

------------------------------------------------------------------------

# Functionaliteit

## D008 -- Lineaire opbouw van het traject

Het traject wordt lineair weergegeven.

## D009 -- Dynamische snelkoppelingen

Het startscherm toont alleen relevante onderdelen.

## D010 -- Geen voortgang in percentages

Voortgang wordt weergegeven in trajectstappen.

------------------------------------------------------------------------

# Informatiearchitectuur

## D011 -- Functionele benamingen

De Product Backlog gebruikt functionele namen.

## D012 -- Geen 'dossier'

Persoonlijke informatie wordt positief en begrijpelijk benoemd.

## D013 -- Werken aan Werk als herkenbare identiteit

De identiteit van Werken aan Werk is zichtbaar in naam, vormgeving en
communicatie.

## D014 -- Mijn omgeving als persoonlijke hub

**Aanleiding**\
De termen *Profiel* en *Persoonlijke gegevens* sluiten onvoldoende aan
bij de beleving van de doelgroep. Jongeren zoeken naar één plek waar
alle informatie over hun traject samenkomt.

**Besluit**\
De vierde knop in de onderste navigatie krijgt de naam **Mijn
omgeving**. Vanuit deze omgeving heeft de jongere toegang tot
persoonlijke informatie, documenten, afspraken, doelen, begeleiding en
instellingen.

**Impact**\
De navigatie sluit beter aan bij de belevingswereld van jongeren en
biedt ruimte voor toekomstige uitbreiding.

**Gerelateerd aan**

-   DOC-003 Product Backlog
-   DOC-004 User Flows
-   DOC-005 UX Specification

------------------------------------------------------------------------

## D015 -- Contextuele titels ondersteunen de fase van het traject

**Aanleiding**\
Een vaste titel zoals **Je volgende stap** sluit niet altijd aan bij de
fase waarin de jongere zich bevindt. Bij de start van het traject is er
nog geen eerdere stap gezet.

**Besluit**\
De titel van de hoofdkaart op Home wordt bepaald door de fase van het
traject:

-   eerste keer of traject nog niet gestart: **Je eerste stap**;
-   actief traject: **Je volgende stap**;
-   laatste fase: **Nog één stap**;
-   afgerond traject: **Kijk terug op je traject**.

**Impact**\
De communicatie op Home sluit beter aan bij de actuele situatie en voelt
persoonlijker en natuurlijker.

**Gerelateerd aan**

-   DOC-001 Product Definition
-   DOC-003 Product Backlog
-   DOC-005 UX Specification

------------------------------------------------------------------------

## D016 -- AI-assistent opgenomen als Must Have in de MVP

**Aanleiding**\
Uit de inhoudelijke review door Brita blijkt dat laagdrempelige digitale
ondersteuning tussen begeleidingsmomenten een kernonderdeel van Werken
aan Werk moet zijn. Jongeren moeten praktische ondersteuning kunnen
krijgen en vragen kunnen stellen die zij niet direct aan hun begeleider
willen voorleggen.

**Besluit**\
De **AI-assistent** wordt opgenomen als Must Have binnen de MVP. De
AI-assistent ondersteunt jongeren bij het zoeken naar vacatures,
opleidingen en cursussen, het controleren en verbeteren van een cv, de
voorbereiding op sollicitaties, uitleg over trajectopdrachten en het
stellen van laagdrempelige of meer anonieme vragen.

De AI-assistent is een aanvulling op de begeleiding en vervangt de
begeleider niet. De assistent neemt geen beslissingen over het traject,
geeft geen diagnoses of professionele hulpverleningsadviezen en verwijst
bij persoonlijke, complexe of onveilige situaties naar de begeleider of
een passende hulp- of noodroute.

**Impact**\
De MVP-scope wordt uitgebreid. Home krijgt een duidelijk maar
ondersteunend toegangspunt tot de AI-assistent. De UX Specification
beschrijft de AI-assistent als UX007, inclusief functies, grenzen,
privacy, veiligheid en overdracht naar menselijke begeleiding. De
Product Definition en Product Backlog moeten met dit besluit in
overeenstemming worden gebracht.

**Gerelateerd aan**

-   DOC-001 Product Definition
-   DOC-003 Product Backlog
-   DOC-004 User Flows
-   DOC-005 UX Specification

------------------------------------------------------------------------

## D017 -- Werk zoeken en reageren als vijfde trajectstap

**Aanleiding**\
Na het maken en bespreken van het cv ontbrak een zelfstandige stap waarin jongeren leren hoe zij passend werk kunnen vinden en hoe zij op een vacature kunnen reageren. Direct doorgaan naar het oefenen van een sollicitatiegesprek slaat een belangrijk deel van het proces over.

**Besluit**\
Het gezamenlijke traject wordt uitgebreid van zeven naar acht stappen. **Werk zoeken en reageren** wordt de vijfde stap, tussen **Maak en bespreek je cv** en **Oefen een sollicitatiegesprek**.

Het doel van deze stap is leren en oefenen. Jongeren ontdekken waar zij werk kunnen zoeken, leren een vacature begrijpen en beoordelen en oefenen met het opstellen van een reactie. Daadwerkelijk reageren is mogelijk, maar niet verplicht en gebeurt alleen wanneer de jongere daar zelf voor kiest.

De vaste route wordt:

1. Kennismaken;
2. Ontdek je talenten;
3. Bespreek je resultaten;
4. Maak en bespreek je cv;
5. Werk zoeken en reageren;
6. Oefen een sollicitatiegesprek;
7. Bekijk je mogelijkheden;
8. Kies je volgende stap.

**Impact**\
De trajectroute, nummering en voortgangsweergave worden aangepast naar acht stappen. De Product Definition, Product Backlog, User Flows en UX Specification worden bijgewerkt. Bestaande ontwerpen met zeven routepunten worden bij een latere ontwerpupdate aangepast.

**Gerelateerd aan**

-   DOC-001 Product Definition
-   DOC-003 Product Backlog
-   DOC-004 User Flows
-   DOC-005 UX Specification

------------------------------------------------------------------------

## D018 -- Stap 8 is één resultaatsscherm na het eindgesprek

**Aanleiding**\
Een afzonderlijke introductie en meerdere invoerschermen voor stap 8 herhaalden keuzes die al in stap 7 en tijdens het eindgesprek met de begeleider worden besproken.

**Besluit**\
Stap 7 ondersteunt de verkenning van mogelijkheden en de voorbereiding op het eindgesprek. Stap 8 bestaat uitsluitend uit één resultaatsscherm na dat gesprek. Het scherm toont de gezamenlijk vastgelegde richting, de eerste concrete actie, wanneer deze wordt opgepakt en wie daarbij helpt.

De jongere kan het volledige plan bekijken en hulp vragen aan de begeleider. De app maakt duidelijk dat het plan later in overleg kan worden aangepast.

**Impact**\
- geen aparte introductie of opdrachtenreeks binnen stap 8;
- minder herhaling tussen stap 7, het eindgesprek en stap 8;
- de begeleider legt de uitkomst samen met de jongere vast;
- Product Definition, Product Backlog, User Flows en UX Specification worden hierop afgestemd.

**Gerelateerd aan**

- DOC-001 Product Definition
- DOC-003 Product Backlog
- DOC-004 User Flows
- DOC-005 UX Specification

------------------------------------------------------------------------

# Reviewstatus

  Reviewer                   Status
  -------------------------- ---------------------
  Lars van Borssum Waalkes   Nog niet beoordeeld
  Brita                      Nog niet beoordeeld

# Wijzigingshistorie

  Versie   Datum       Wijziging
  -------- ----------- ---------------------------------------------------
  0.1      Juli 2026   Eerste versie.
  0.2      Juli 2026   Structuur verbeterd.
  0.3      Juli 2026   D014 toegevoegd en afgestemd op UX Specification.
  0.4      Juli 2026   D016 toegevoegd: AI-assistent als Must Have in de MVP.
  0.5      Augustus 2026 D017 toegevoegd: achtstappenroute en Werk zoeken en reageren.
  0.6      Augustus 2026 D018 toegevoegd: stap 8 beperkt tot één resultaatsscherm na het eindgesprek.

# GitHub

**Bestandsnaam**

`docs/02_Decision_Log.md`

**Commit message**

`Add work search and response step`

**Commit description**

``` text
Add Work zoeken en reageren as a new MVP trajectory step.

Changes:
- Added D017 defining the new fifth trajectory step
- Expanded the shared route from seven to eight steps
- Defined learning and practice as the goal of the step
- Kept sending an actual response optional and user-controlled
```
