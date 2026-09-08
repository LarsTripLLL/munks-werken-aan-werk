# Munks Werkt PWA

Productiegerichte bouwbasis voor de responsive deelnemersapp. De bestaande HTML-bestanden blijven reviewbronnen; deze map wordt de uitvoerbare applicatie.

## Eerste mijlpaal

- React en TypeScript;
- responsive mobile-first interface;
- installeerbaar PWA-manifest;
- service worker voor offline opstart;
- domeinmodellen en verwisselbare gegevenslaag;
- accountactivering met e-mailadres en activatiecode;
- afzonderlijke instemming met privacyverklaring en toestemmingsformulier;
- optionele toestemming voor de AI-assistent;
- voorbereid scherm voor biometrisch inloggen;
- centrale trajectdefinitie voor alle zeven stappen en hun zichtbaarheidsregels;
- tijdelijke gegevenslaag voor automatisch opslaan zonder browseropslag;
- werkende stap 1 met de voorbereiding en beginmeting;
- werkende stap 2 met toestemming, externe testkoppeling en gecontroleerde vrijgave van resultaten;
- werkende stap 3 met cv-invoer, automatisch opslaan, voorbeeld en download;
- werkende stap 4 met voorbereiding op de groepsbespreking en toegang tot het cv;
- werkende stap 5 met werk zoeken, een voorbeeldbaan beoordelen en een reactie voorbereiden;
- werkende stap 6 met gespreksvoorbereiding, automatische opslag en AI-toegangspunten;
- werkende stap 7 met richtingskeuze, eindmeting, eindgesprek en menselijke vrijgave van het resultaat;
- gedeelde dashboardbasis met afgeschermde weergaven voor begeleider, projectleider en opdrachtgever;
- deelnemerdetail voor begeleider/projectleider met aanwezigheidsregistratie en vrijgave van het definitieve advies;
- projectleidersbeheer voor nieuwe trajecten, gewijzigde looptijden en het toevoegen van deelnemers;
- deelnemersinbox met meerdere gesprekken, ongelezen berichten, antwoorden en nieuwe hulpvragen;
- begeleidersinbox per gekoppeld traject met beantwoorden en afhandelen van hulpvragen;
- uitsluitend fictieve demonstratiegegevens;
- geen wachtwoorden of andere gevoelige gegevens in `localStorage`.

## Lokaal starten

```text
pnpm install
pnpm dev
```

De standaardinstelling is `VITE_DATA_MODE=demo`. Met `VITE_DATA_MODE=api`
gebruiken de deelnemers- en begeleidersinbox de beveiligde serverroutes uit
`API_CONTRACT.md`. Deze instelling bevat geen wachtwoord of toegangssleutel.

Een productiebuild bevat standaard geen publieke bronbestanden. Voor de afgesproken technische veiligheidstest kan afzonderlijk een inzichtelijke testbuild worden gemaakt:

```text
pnpm build:security
```

## Veiligheidsgrens

`DemoParticipantRepository` en `DemoAuthRepository` worden uitsluitend gebruikt voor ontwerp- en functietests. Voor de pilot worden deze vervangen door repositories die communiceren met beveiligde serverfuncties. Rollen, tenantafscherming en gegevensrechten worden nooit alleen in de browser afgedwongen.

Voor de lokale demonstratie kunnen de dashboardrollen na inloggen worden geopend met `?role=coach`, `?role=project_leader` of `?role=commissioner`. Dit is nadrukkelijk geen productie-autorisatie. In de pilot bepaalt uitsluitend de gevalideerde serversessie de rol en toegestane trajecten; een URL-parameter mag daar nooit rechten geven.

`DemoAnswerRepository` bewaart antwoorden alleen tijdelijk in het geheugen. Vernieuwen of sluiten wist deze demonstratiegegevens. In de pilot schrijft dezelfde schermlogica via een beveiligde API naar de database.

De huidige biometrische knop is een gebruikersscherm, nog geen echte registratie. De pilot gebruikt hiervoor WebAuthn/passkeys. Daarbij blijven vingerafdruk- en gezichtsgegevens op het toestel en bewaart de server alleen de daarvoor bedoelde publieke sleutel.

De service worker bewaart geen aanvragen aan `/api/` en geen bronnen van andere internetdomeinen. Persoonsgegevens en accountgegevens mogen later niet in de openbare offline-cache terechtkomen.

De URL van de externe talententest wordt per beveiligde omgeving ingesteld als `VITE_TALENT_TEST_URL`. In de uiteindelijke pilot hoort de server een deelnemerspecifieke testlink te leveren; die link mag niet als algemeen geheim in de broncode worden opgenomen.

## Volgende bouwstap

De demonstratiegegevens vervangen door een beveiligde testbackend met echte accounts, servergestuurde rollen en tenantafscherming. Het databaseschema bevat inmiddels de basis voor trajecten, antwoorden, metingen, afspraken, documenten en berichten. De volgende koppeling is het begeleidersdeel van de inbox en de servergestuurde repositories in de PWA.
