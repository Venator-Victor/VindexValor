# VindexValor

Open-source personal finance and budget management web application.

## Description

VindexValor is a web application focused on personal finance management, budgeting, and transaction tracking. Developed as a final course project (TCC) for the Postgraduate in Full Stack Development at PUC-RS.

At the moment, the application is still experimental and may contain bugs, incomplete features, and breaking changes.

Current features include account management, transaction tracking, credit card invoices, investments, recurring transactions, financial goals, historical inflation analysis (IPCA/BCB), investment and inflation simulators, and cloud synchronization through Supabase.

Future plans include desktop and mobile applications, offline support, advanced analytics, investment syncing, and multi-user budgeting.

## Tech Stack

| Technology | Version |
|---|---|
| React | 19.2.6 |
| Vite | 8.0.14 |
| Tailwind CSS | 4.3.0 |
| Supabase JS | 2.106.2 |
| React Router DOM | 7.16.0 |
| Framer Motion | 12.40.0 |
| Recharts | 3.8.1 |
| React Hook Form | 7.76.1 |
| date-fns | 4.3.0 |
| Radix UI | various |

## Self-Hosting

VindexValor doesn't require the official hosted backend. Since it's built on [Supabase](https://supabase.com), you can run your own instance — hosted on Supabase's cloud or fully [self-hosted via Docker](https://supabase.com/docs/guides/self-hosting) — and keep complete control over where your financial data lives.

1. Fork this repository.
2. Create a Supabase project (hosted or self-hosted) and install the [Supabase CLI](https://supabase.com/docs/guides/cli).
3. Link your project and apply the database schema:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
4. Deploy the Edge Functions (used for server-side balance/goal/recurring calculations and inflation data):
   ```bash
   for fn in supabase/functions/*/; do
     name=$(basename "$fn")
     [ "$name" = "_shared" ] && continue
     npx supabase functions deploy "$name"
   done
   ```
5. Set your own credentials in `.env`:
   ```
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
6. Build and deploy the frontend (`npm run build`) to any static host.

Each self-hosted instance is fully isolated — your data never touches the official VindexValor infrastructure.

## Authors

VenatorVictor

GitHub: https://github.com/Venator-Victor

## Version History

* 0.3

  * Historical IPCA inflation card with BCB API integration (1995–present)
  * Inflation simulator with area chart (inflation vs. investment return)
  * Investment simulator with compound interest, stacked area chart and crossover marker
  * Suporte page: replaced placeholder form/contacts with real FAQ and contact links
  * Configurações: local logo, updated About text, open source notice
  * Landing page: open source mention

* 0.2

  * Added automated testing infrastructure
  * Improved form validation
  * Security improvements
  * Supabase migration fixes

* 0.1

  * Initial Release

## License

This project is licensed under the GNU Affero General Public License v3 (AGPL-3.0) - see the LICENSE file for details.

## Trademark Notice

The VindexValor name and branding are reserved.

Forks and modified versions may not use the official VindexValor branding, logo, or identity without permission.