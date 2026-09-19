# AI-assistent publiceren

Voer deze stappen in deze volgorde uit.

## 1. Database controleren en publiceren

```powershell
npx.cmd supabase db push --dry-run
npx.cmd supabase db push
```

Voor een nieuwe installatie worden `202609180022_ai_assistant.sql`,
`202609190023_ai_usage_guard.sql` en
`202609190024_ai_retention_schedule.sql` toegepast. Als de AI-assistent al
draait, verschijnen alleen de nog niet toegepaste migraties. Publiceer de
database eerst en de `ai-assistant`-functie daarna. De laatste migratie plant
een uurlijkse verwijdering van berichten ouder dan 90 dagen. Controleer na
publicatie onder **Supabase → Integrations → Cron → Jobs** of
`munks-ai-retention-90d` actief is en later een geslaagde uitvoering heeft.

## 2. OpenAI-geheim instellen

Open in Supabase het project en ga naar **Edge Functions → Secrets**. Voeg toe:

- `OPENAI_API_KEY`: een project-API-sleutel van het OpenAI API Platform.
- `OPENAI_MODEL`: optioneel, standaard wordt `gpt-5-mini` gebruikt.
- `AI_DAILY_GLOBAL_LIMIT`: optioneel, standaard `500` vragen per dag.

Plaats de API-sleutel nooit in `.env`, frontendcode, screenshots, Git of deze chat.

## 3. Functies publiceren

```powershell
npx.cmd supabase functions deploy activation-api --no-verify-jwt
npx.cmd supabase functions deploy ai-assistant
```

## 4. Acceptatietest

Test met een deelnemer die toestemming geeft en een deelnemer die weigert:

1. Assistent aan- en uitzetten.
2. Normale vraag over cv, werk, opleiding en gespreksvoorbereiding.
3. Vraag buiten het traject.
4. Vraag met het woord BSN of wachtwoord.
5. Controleren dat begeleider en opdrachtgever de gesprekken niet zien.
6. Foutmelding bij ontbrekende API-koppeling.
7. Daglimiet en lange invoer controleren. De limiet telt aanvragen, ook als een
   externe dienst daarna tijdelijk geen antwoord kan geven.

De assistent is pas pilotgereed nadat deze tests op de gepubliceerde omgeving zijn geslaagd.
