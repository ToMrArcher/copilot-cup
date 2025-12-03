# Project Context

## Purpose
A minimal, extendable, tech-agnostic skeleton for a no-code KPI/dashboard platform. Designed to be Docker-first and AWS-ready.

Funksjonelle krav:
1. Integrasjoner (no-code)
Når jeg kobler på en ny datakilde,
vil jeg konfigurere tilgang og felter i et visuelt grensesnitt,
slik at integrasjoner kan settes opp uten kodeendringer.

Når jeg legger inn API-nøkler eller OAuth-tokens,
vil jeg at systemet håndterer dem sikkert og skjult,
slik at sensitive data ikke eksponeres.

Når jeg mapper felter,
vil jeg se live-eksempler på data,
slik at jeg kan validere mappet umiddelbart.

2. KPIer og transformasjoner
Når jeg oppretter en KPI,
vil jeg kunne velge hvilke felter fra hvilke datakilder som inngår,
slik at KPI-logikken er gjenbrukbar og ikke skjult i kode.

Når jeg må transformere eller kombinere data,
vil jeg kunne bruke et lettfattelig formel-/funksjonsverktøy,
slik at jeg kan lage KPIer basert på flere kilder.

Når jeg definerer en KPI med et mål,
vil jeg kunne sette målverdi, periode og retning,
slik at systemet vet hva som kvalifiserer som «på vei mot mål».

Når en KPI har flere mål (måned/kvartal/år),
vil jeg enkelt kunne bytte aktivt mål,
slik at visualiseringen følger riktig periode.

3. Sikkerhet og tilgang
Når jeg logger inn,
vil jeg bruke en sikker metode med roller og rettigheter,
slik at kun autoriserte personer ser sensitive KPIer.

Når jeg administrerer dashboards,
vil jeg styre tilgangen per bruker eller team,
slik at ingen ser mer enn de skal.

4. Presentasjon og visualisering
Når jeg åpner dashboardet,
vil jeg se en klar struktur med KPIer gruppert etter tema,
slik at jeg kan forstå situasjonen uten å lete.

Når jeg vil endre rekkefølge eller oppsett,
vil jeg kunne dra-og-slippe widgets,
slik at jeg kan skreddersy visningen uten å lage en ny rapport.

Når jeg ser en KPI,
vil jeg kunne sammenligne med samme periode tidligere (f.eks. forrige uke, måned eller kvartal),
slik at jeg ser om utviklingen går i riktig retning.

5. Deling
Når jeg deler rapporter eksternt,
vil jeg generere tidsbegrensede hemmelige URLer, 
slik at mottaker får kontrollert tilgang uten konto.

Når jeg avslutter deling,
vil jeg kunne deaktivere lenken umiddelbart,
slik at tilgangen ikke lever videre.

Når jeg deler en KPI eksternt,
vil jeg velge om måloppnåelse skal vises eller skjules,
slik at vi kontrollerer narrativet.

6. Dataflyt og refresh
Når jeg trenger oppdaterte tall,
vil jeg trigge refresh manuelt eller tidsstyre den,
slik at dashboardet alltid viser ferske data.

Når en integrasjon feiler,
vil jeg få en tydelig feilmelding med forslag til løsning,
slik at jeg kan fikse det raskt.

Supplerende konkurransekriterier
AI-first arbeid: Teamet skal eksplisitt vise hvor AI ga hastighetsgevinst (kode, UI, dokumentasjon, arkitektur).

Ingen hardkoding av integrasjoner: Struktur må støtte at nye kilder kan legges til gjennom UI.

Minstekrav demo: Én dashboard-side, minst 3 KPIer, minst 2 datakilder (API + manuell input).

Modulær arkitektur: Integrasjons-adaptere, formel-engine, dashboard-widgets.

Sikkerhetsbaseline: Kryptert nøkkellagring, beskyttet API, tydelig rollemodell.

Delingsbaseline: Signerte hemmelige URLer med optional expiry.

Brukervennlighet: Wizard for integrasjoner, live preview, drag-and-drop layout.

Visuell kvalitet: Smarte defaults, konsekvent typografi, ren grid-oppbygning.

Observability: Enkel logg av sync-status og siste refresh.

Inline metadata: «Kilde», «Sist oppdatert», «Synk-status».

Caching: Lett caching-lag for å unngå å kalle eksterne APIer unødvendig.

Rate-limit-håndtering: Unngå overdrevent mange kall til hvert API.

## Tech Stack
- Typescript
- Javascript
- React
- ChartJS
- PostgresQL

## Project Conventions

### Code Style
Standard typescript conventions.

### Architecture Patterns
Docker
Docker Compose

### Testing Strategy
[Explain your testing approach and requirements]

### Git Workflow
[Describe your branching strategy and commit conventions]

## Domain Context
[Add domain-specific knowledge that AI assistants need to understand]

## Important Constraints
[List any technical, business, or regulatory constraints]

## External Dependencies
[Document key external services, APIs, or systems]
