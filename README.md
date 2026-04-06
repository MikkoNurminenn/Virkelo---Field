# PGP Operointi

Sisäinen Next.js + Prisma -sovellus PGP Putki Oy:n keikkojen hallintaan, dokumentointiin ja kuvien tallennukseen.

## Mitä mukana on

- sähköpostilinkillä toimiva kirjautuminen (`Auth.js` + Resend)
- aktiiviset keikat, omat keikat, arkisto ja ilmoitukset
- keikan luonti, työn alle ottaminen, palautus avoimeksi, peruminen ja uudelleenavaus
- toteutusraportti, muistiinpanot ja suojattu kuvagalleria per keikka
- admin-näkymä käyttäjien aktivointiin ja piilotettujen keikkojen hallintaan
- Railway-yhteensopiva deploy-konfiguraatio PostgreSQL:lle ja private bucket -kuvatallennukselle

## Kehitys

1. Kopioi `.env.example` -> `.env`.
2. Lisää PostgreSQL-, Resend- ja bucket-ympäristömuuttujat.
3. Aja:

```bash
npm install
npm run db:generate
npm run dev
```

Jos käytössä on paikallinen PostgreSQL:

```bash
npm run db:migrate
```

## Testit ja build

```bash
npm run test
npm run lint
npm run build
```

## Railway

`railway.json` ajaa deployn yhteydessä:

- `npm run db:deploy`
- healthcheckin polkuun `/api/health`

Bucketille odotetaan S3-yhteensopivia ympäristömuuttujia:

- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
