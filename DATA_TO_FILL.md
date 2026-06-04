# DATA_TO_FILL — Carbon Cleaner

Every **real-world** number in the game is a numbered DATA BLANK. Until you fill it in, the UI shows an amber `[FILL IN #NNN]` pill. To fill one in, open `lib/config/dataBlanks.ts`, set the blank's `value` and `source`, and it will render the real number everywhere and appear on the `/sources` page automatically.

> Game-balance constants (budgets, support %, timelines, etc.) are NOT blanks — they live in `lib/config/gameConstants.ts` and are pre-set.

**Progress: 0 / 28 filled in.**

## Checklist

- [ ] #001 — Current global atmospheric CO2 concentration (ppm) — used in: Home > climate context, About > global framing — SOURCE: ____
- [ ] #002 — Global average temperature rise since pre-industrial era (deg C) — used in: Home > climate context, About — SOURCE: ____
- [ ] #003 — Annual global CO2 emissions from fossil fuels (gigatonnes CO2/yr) — used in: About > global framing — SOURCE: ____
- [ ] #004 — Sea level rise observed since 1900 (cm) — used in: About > impacts — SOURCE: ____
- [ ] #005 — Share of U.S. emissions from transportation (%) — used in: About > local framing, How to Play — SOURCE: ____
- [ ] #006 — Average per-capita CO2 emissions (United States) (tonnes CO2/person/yr) — used in: About > local framing — SOURCE: ____
- [ ] #007 — Number of U.S. communities affected by extreme heat annually (count or %) — used in: About > local impacts — SOURCE: ____
- [ ] #020 — Cost to convert municipal streetlights to LED (per fixture) (USD/fixture) — used in: Shop > LED Streetlight Conversion — SOURCE: ____
- [ ] #021 — CO2 reduction from LED streetlight conversion (county scale) (tonnes CO2/yr) — used in: Shop > LED Streetlight Conversion — SOURCE: ____
- [ ] #022 — CO2 saved per rider shifting from car to public bus (kg CO2/yr/rider) — used in: Shop > Expanded Public Bus Routes — SOURCE: ____
- [ ] #023 — CO2 avoided by commercial recycling program (tonnes CO2/yr) — used in: Shop > Mandatory Commercial Recycling — SOURCE: ____
- [ ] #024 — Cost to install rooftop solar per public building (USD/building) — used in: Shop > Solar Panels on Public Buildings — SOURCE: ____
- [ ] #025 — CO2 offset by a mature urban tree per year (kg CO2/yr/tree) — used in: Shop > Urban Tree Planting, Tree Planting panel — SOURCE: ____
- [ ] #026 — CO2 reduction from green building codes (new construction) (% reduction vs baseline) — used in: Shop > Green Building Code — SOURCE: ____
- [ ] #027 — CO2 saved by electrifying a municipal vehicle fleet (tonnes CO2/yr) — used in: Shop > Electric County Fleet — SOURCE: ____
- [ ] #028 — Efficiency gain from smart grid energy management (% grid loss reduction) — used in: Shop > Smart Grid Energy Management — SOURCE: ____
- [ ] #029 — CO2 captured per direct-air-capture scrubber unit (tonnes CO2/yr/unit) — used in: Shop > Atmospheric Carbon Scrubber Array — SOURCE: ____
- [ ] #030 — CO2 captured per algae bioreactor (tonnes CO2/yr/reactor) — used in: Shop > Algae Bio-Reactor Carbon Sinks — SOURCE: ____
- [ ] #031 — CO2 avoided by geothermal district heating (tonnes CO2/yr) — used in: Shop > Geothermal District Heating — SOURCE: ____
- [ ] #032 — CO2 saved by autonomous electric transit vs private cars (tonnes CO2/yr) — used in: Shop > Autonomous Electric Transit Pods — SOURCE: ____
- [ ] #033 — Energy output of a vertical-axis wind turbine (kWh/yr/turbine) — used in: Shop > Vertical Wind Turbine Neighborhoods — SOURCE: ____
- [ ] #034 — CO2 reduction from carbon-negative concrete vs Portland cement (% per tonne) — used in: Shop > Carbon-Negative Concrete Initiative — SOURCE: ____
- [ ] #040 — Plastic waste reduction from single-use plastic ban (tonnes/yr) — used in: Bills > Ban on Single-Use Plastics — SOURCE: ____
- [ ] #041 — Typical revenue from a local carbon tax (USD/yr) — used in: Bills > Carbon Tax on Local Businesses — SOURCE: ____
- [ ] #042 — Energy savings from mandatory home energy audits (% household energy) — used in: Bills > Mandatory Home Energy Audits — SOURCE: ____
- [ ] #043 — Emissions from gas-powered lawn equipment (per hour of use) (kg CO2/hr) — used in: Bills > Gas-Powered Lawn Equipment Ban — SOURCE: ____
- [ ] #060 — Local representative contact info (state/district lookup) (name + office + email) — used in: Civic Action > Representative Lookup — SOURCE: ____
- [ ] #061 — Climate statistic surfaced to letter writers (fact pool) (varies (see letterFacts.ts)) — used in: Civic Action > Letter Builder (older students) — SOURCE: ____
