# Supabase e-mailsjablonen

Deze bestanden worden niet automatisch door GitHub of een database-migratie naar Supabase gepubliceerd. Plak de inhoud na publicatie van de app handmatig in **Authentication → Emails → Templates**.

- **Invite user**: onderwerp `Activeer je account voor Munks Werkt`; inhoud uit `invite.html`.
- **Reset password / Recovery**: onderwerp `Herstel je wachtwoord voor Munks Werkt`; inhoud uit `recovery.html`.

De variabele `{{ .Token }}` moet blijven staan: Supabase vervangt die door de eenmalige code. De link mag uitsluitend de app openen en mag niet worden vervangen door `{{ .ConfirmationURL }}`, omdat e-mailscanners die eenmalige link kunnen verbruiken.
