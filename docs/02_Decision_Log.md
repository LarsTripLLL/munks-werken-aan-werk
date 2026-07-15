# Decision Log

**Document ID**\
DOC-002

**Project**\
Werken aan Werk

**Versie**\
0.3

**Status**\
Concept

**Auteur**\
OpenAI ChatGPT

**Product Owner**\
Lars van Borssum Waalkes

**Inhoudelijke review**\
Brita

**Laatste wijziging**\
Juli 2026

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

# GitHub

**Bestandsnaam**

`docs/02_Decision_Log.md`

**Commit message**

`Update Decision Log to v0.3`

**Commit description**

``` text
Update Decision Log.

Changes:
- Added D014 'Mijn omgeving' as personal hub
- Improved consistency with UX Specification
- Linked decision to related project documents
```


## D015 – Contextuele titels ondersteunen de fase van het traject

**Besluit**: De titel van de hoofdkaart op Home wordt bepaald door de fase van het traject.

- Eerste keer: **Je eerste stap**
- Actief traject: **Je volgende stap**
- Laatste fase: **Nog één stap**
- Afgerond: **Kijk terug op je traject**
