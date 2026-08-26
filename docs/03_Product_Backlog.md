Document ID
DOC-003

# Product Backlog

**Project**  
Munks Werkt

**Versie**  
0.4

**Status**  
Concept

**Auteur**  
OpenAI ChatGPT

**Product Owner**  
Lars van Borssum Waalkes

**Inhoudelijke review**  
Brita

**Laatste wijziging**  
Augustus 2026

---

# Doel

De Product Backlog bevat alle functionaliteiten die onderdeel zijn van de ontwikkeling van Munks Werkt.

Per functionaliteit wordt vastgelegd:

- het doel;
- de belangrijkste stakeholder;
- de prioriteit;
- de ontwikkelstatus.

De Product Backlog is een levend document en wordt gedurende de ontwikkeling aangevuld en geprioriteerd.

---

# Prioriteiten

| Prioriteit | Betekenis |
|------------|-----------|
| **Must Have** | Noodzakelijk voor de eerste pilot. |
| **Should Have** | Belangrijk, maar niet noodzakelijk voor de eerste pilot. |
| **Could Have** | Waardevolle uitbreiding voor een volgende release. |
| **Future** | Buiten de huidige projectscope. |

---

# Functionaliteiten

| ID | Functionaliteit | Stakeholder | Doel | Prioriteit | Status |
|----|-----------------|-------------|------|------------|--------|
| PB001 | Home | Jongere | De jongere direct overzicht en richting bieden. | Must Have | Open |
| PB002 | Trajectoverzicht | Jongere | Inzicht geven in de route van het programma. | Must Have | Open |
| PB003 | Trajectstap | Jongere | Informatie, opdrachten en ondersteuning per stap aanbieden. | Must Have | Open |
| PB004 | Persoonlijke informatie | Jongere | Alle relevante persoonlijke informatie binnen het traject bundelen. | Must Have | Open |
| PB005 | Persoonlijk profiel | Jongere | Inzicht geven in persoonlijke gegevens, doelen en begeleiding. | Must Have | Open |
| PB006 | Begeleidersdashboard | Begeleider | Begeleiders ondersteunen bij het volgen en begeleiden van deelnemers. | Must Have | Open |
| PB007 | Vacatureoverzicht | Jongere | Relevante vacatures tonen. | Could Have | Backlog |
| PB008 | Herinneringen | Jongere | Ondersteunen bij afspraken en belangrijke momenten. | Could Have | Backlog |
| PB009 | Berichten | Jongere / Begeleider | Communicatie tussen jongere en begeleider ondersteunen. | Future | Backlog |
| PB010 | AI-assistent | Jongere | Laagdrempelige ondersteuning bieden bij vacatures, opleidingen, cv, sollicitatievoorbereiding, trajectopdrachten en vragen tussen begeleidingsmomenten. | Must Have | Open |
| PB011 | Werkgeversomgeving | Werkgever | Samenwerking met werkgevers ondersteunen. | Future | Backlog |
| PB012 | Externe koppelingen | Organisatie | Gegevens uitwisselen met andere systemen. | Future | Backlog |
| PB013 | Werk zoeken en reageren | Jongere | Leren waar passend werk te vinden is, een vacature beoordelen en een reactie oefenen. | Must Have | Gereed voor ontwerp |

---

# Ontwikkelstatus

| Status | Betekenis |
|---------|-----------|
| Open | Nog niet gestart. |
| In uitwerking | Wordt functioneel uitgewerkt. |
| Gereed voor ontwerp | Klaar voor UX-ontwerp. |
| Gereed voor ontwikkeling | Ontwerp afgerond. |
| In ontwikkeling | Wordt gebouwd. |
| Test | Gereed voor testen. |
| Afgerond | Opgenomen in de applicatie. |

---

# Functionele uitwerking

## PB001 – Home

**Functionele eis**  
De titel van de hoofdkaart op Home is contextafhankelijk.

**Acceptatiecriteria**

- eerste keer of traject nog niet gestart: **Je eerste stap**;
- actief traject: **Je volgende stap**;
- laatste trajectfase: **Nog één stap**;
- afgerond traject: **Kijk terug op je traject** of een passende
  afsluitende titel.

## PB010 – AI-assistent

**Functionele eisen**

De AI-assistent:

- is vanaf Home duidelijk bereikbaar;
- helpt zoeken naar passende vacatures;
- helpt zoeken naar opleidingen, cursussen en leerwerktrajecten;
- kan een door de jongere gekozen cv of tekst controleren;
- ondersteunt bij motivatiebrieven en sollicitatievoorbereiding;
- geeft uitleg over opdrachten binnen de actuele trajectstap;
- biedt ruimte om laagdrempelige of meer anonieme vragen te stellen;
- maakt duidelijk dat antwoorden door AI worden gegenereerd;
- vervangt de begeleider niet en neemt geen beslissingen over het
  traject;
- verwijst bij persoonlijke, complexe of onveilige situaties naar de
  begeleider of een passende hulp- of noodroute.

**Acceptatiecriteria**

- de jongere kan de AI-assistent vanaf Home vinden en openen;
- de jongere kan een eigen vraag stellen;
- de jongere kan een vacature- of opleidingszoekopdracht starten;
- de jongere kan bewust een cv of tekst aanbieden voor controle;
- actuele zoekresultaten tonen waar mogelijk bron en datum;
- de interface legt uit welke gegevens worden gebruikt en of gesprekken
  worden opgeslagen;
- het woord **anoniem** wordt alleen gebruikt wanneer dit technisch en
  juridisch werkelijk klopt;
- de jongere kan vanuit de AI-assistent contact met de begeleider zoeken;
- de AI geeft geen diagnoses of professioneel medisch, juridisch of
  financieel advies.

## PB013 – Werk zoeken en reageren

**Functionele eisen**

De trajectstap:

- legt in begrijpelijke taal uit waar werk kan worden gezocht;
- introduceert het woord **vacature** met een korte, eenvoudige uitleg;
- helpt de jongere bepalen wat passend werk kan zijn;
- helpt een vacature lezen en onderscheid maken tussen wensen en harde eisen;
- toont verschillende manieren om te reageren, zoals via een formulier, e-mail, telefoon of WhatsApp;
- laat de jongere een korte reactie oefenen;
- maakt duidelijk dat de jongere zelf bepaalt of een reactie daadwerkelijk wordt verstuurd;
- biedt waar passend toegang tot de AI-assistent en hulp van de begeleider.

**Acceptatiecriteria**

- de jongere kan minimaal twee manieren noemen om werk te zoeken;
- de jongere kan belangrijke informatie in een vacature herkennen;
- de jongere kan aangeven waarom werk wel of niet passend lijkt;
- de jongere kan een conceptreactie opstellen en bewaren;
- een conceptreactie wordt nooit automatisch verstuurd;
- de stap kan worden afgerond zonder daadwerkelijk te solliciteren;
- de interface gebruikt **Werk zoeken en reageren** als titel van stap 5.

## PB014 – Jouw volgende stap

**Functionele eisen**

- het resultaatsscherm rondt stap 7 en het traject af na het eindgesprek;
- het scherm toont de afgesproken richting, eerste actie, planning en ondersteuning;
- de jongere kan het volledige plan bekijken;
- de jongere kan eenvoudig hulp vragen aan de begeleider;
- het scherm vermeldt dat het plan later in overleg kan veranderen;
- de afronding bevat geen herhaalde keuze- of voorbereidingsopdrachten.

**Acceptatiecriteria**

- de vier afspraken zijn direct herkenbaar en in begrijpelijke taal geschreven;
- de informatie is door jongere en begeleider gezamenlijk vastgesteld;
- er wordt niets automatisch extern verstuurd;
- de jongere kan vanuit het scherm contact zoeken met de begeleider.

---

# Reviewstatus

| Reviewer | Status |
|-----------|--------|
| Lars van Borssum Waalkes | Akkoord |
| Brita | Feedback verwerkt – herreview nodig |

---

# Wijzigingshistorie

| Versie | Datum | Wijziging |
|---------|--------|-----------|
| 0.1 | Juli 2026 | Eerste versie van de Product Backlog opgesteld. |
| 0.2 | Juli 2026 | Documentmetadata en terminologie bijgewerkt; contextuele titel voor Home toegevoegd. |
| 0.3 | Juli 2026 | PB010 gewijzigd naar AI-assistent als Must Have en functionele eisen en acceptatiecriteria toegevoegd. |
| 0.4 | Augustus 2026 | PB013 toegevoegd voor stap 5 **Werk zoeken en reageren**; leerdoel, eigen regie en acceptatiecriteria vastgelegd. |
| 0.5 | Augustus 2026 | PB014 toegevoegd: **Jouw volgende stap** rondt stap 7 en het traject af na het eindgesprek. |
