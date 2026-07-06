# VindexValor

Open-source personal finance and budget management web application.

## Description

VindexValor is a web application focused on personal finance management, budgeting, and transaction tracking. Developed as a final course project (TCC) for the Postgraduate in Full Stack Development at PUC-RS.

At the moment, the application is still experimental and may contain bugs, incomplete features, and breaking changes.

Current features include account management, transaction tracking, credit card invoices, investments, recurring transactions, financial goals, historical inflation analysis (IPCA/BCB), investment and inflation simulators, and cloud synchronization through Supabase.

Future plans include desktop and mobile applications, offline support, advanced analytics, investment syncing, and multi-user budgeting.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Deno Edge Functions)
- **i18n:** i18next (`pt`, `en`)
- **Tests:** Vitest

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

## License

This project is licensed under the GNU Affero General Public License v3 (AGPL-3.0) - see the LICENSE file for details.

## Trademark Notice

The VindexValor name and branding are reserved.

Forks and modified versions may not use the official VindexValor branding, logo, or identity without permission.