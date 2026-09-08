# Munks Werkt - technische architectuur pilot

**Status:** bouwbasis 0.1  
**Datum:** 31 augustus 2026

## Uitgangspunt

De pilot bestaat uit een mobiele webapp voor deelnemers en afzonderlijke
desktopweergaven voor begeleiders, projectleider en RSD. Alle onderdelen
gebruiken dezelfde database, maar krijgen verschillende rechten.

## Opbouw

1. **Gebruikersinterface**
   - mobiel eerst voor deelnemers;
   - desktop voor dashboards en beheer;
   - gedeelde Munks Werkt-huisstijl;
   - werkt als installeerbare webapp.
2. **Applicatielaag**
   - accountactivatie en inloggen;
   - trajectstappen, antwoorden en voortgang;
   - afspraken, documenten en berichten;
   - AI-assistent binnen de trajectscope.
3. **Database en autorisatie**
   - één account kan meerdere deelnames hebben;
   - rechten worden per trajectuitvoering toegekend;
   - toegang wordt in de database afgedwongen;
   - gevoelige toegang en wijzigingen worden gelogd.

## Voorlopige rollen

- deelnemer;
- primaire begeleider;
- trajectbegeleider;
- projectleider;
- RSD-medewerker;
- functioneel beheerder;
- technisch beheerder;
- AI-service.

De definitieve rechten blijven configureerbaar totdat de autorisatiematrix
met Brita, de RSD en de privacyfunctionaris is vastgesteld.

## Bouwvolgorde

1. gedeelde visuele basis en navigatie;
2. accountactivatie, privacy en inloggen;
3. trajectuitvoering, deelname en zeven stappen;
4. Home en Jouw route met echte voortgang;
5. vraag-, invoer- en resultaatschermen;
6. begeleiders- en projectleidersdashboard;
7. beperkt RSD-dashboard;
8. AI-assistent;
9. beveiligings-, privacy- en gebruikerstest.

## Veiligheidsregels

- Geen echte persoonsgegevens in demonstratiegegevens.
- Geen wachtwoorden in de applicatiecode of database opslaan.
- Geen ruime toegangsrechten vooruitlopend op definitieve besluitvorming.
- AI ontvangt alleen context die nodig is voor de actuele vraag.
- Assessmentresultaten worden pas na het begeleidingsgesprek vrijgegeven.

