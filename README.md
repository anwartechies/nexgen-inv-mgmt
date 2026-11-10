# NexGen Inventory

Clinic medicine inventory with three roles:

| Role | Where | What they do |
|---|---|---|
| **Employee** | Mobile app | Pick medicine for a patient (batch chosen automatically, expiring soonest first), see today's pickups and history |
| **Manager** | Mobile app | Stock list, add stock / new batches, low-stock and expiry alerts, count corrections, returns |
| **Super Admin** | Mobile app **and** web console | Today summary, EOD report (PDF + WhatsApp), expiry watch ("use first"), stock, team, patients, pickup and stock logs |

```
server/      Express + Sequelize + PostgreSQL API (port 4000)
mobile/      React + Vite + Tailwind mobile app, all roles (port 5173)
admin-web/   React + Vite + Tailwind Super Admin console (port 5174)
```

## Setup

```bash
npm install            # root (concurrently)
npm run install:all    # server, mobile, admin-web
npm run db:create      # creates the nexgen_inventory database
npm run seed           # resets the database and loads demo data
npm run dev            # API + mobile + admin console together
```

Settings are in `server/.env` (copy `server/.env.example`). **Change `JWT_SECRET` and `JWT_REFRESH_SECRET` before going live.**

Demo logins (PIN `1234`): Super Admin `9000000001`, Manager `9000000002`, Employees `9000000003`, `9000000004` and `9000000005`.

- Mobile app: http://localhost:5173. To use it on a phone on the same Wi-Fi, open `http://<your-PC-IP>:5173` and "Add to Home screen".
- Admin console: http://localhost:5174

Both apps proxy `/api` to `http://127.0.0.1:4000`. Set `API_URL` to point the proxy somewhere else, or set `VITE_API_URL` at build time when the API is hosted on a different domain.

## How stock works

- **Medicine → Batches.** Each delivery is a batch with its own number, expiry date and quantity. Adding the same batch number again increases its quantity.
- **Picking (FEFO).** A pickup takes stock first from batches marked "use first", then from the batch that expires soonest. Expired, returned and disposed batches are never issued. If one batch doesn't have enough, the rest comes from the next batch. Each pickup runs in a database transaction with row locks, so two people picking at once cannot oversell.
- **Visit.** One "Confirm pickup" is one visit (one employee, one patient, one or more medicines). The reports count visits and items from these.
- **Stock log.** Every receipt, count correction, return and disposal is saved with who did it and when.

## API (all under `/api`, Bearer token except login/refresh)

| Method & path | Roles | Purpose |
|---|---|---|
| `POST /auth/login` `{mobile, pin}` | all | Returns `accessToken` (12 h) + `refreshToken` (30 d) |
| `POST /auth/refresh`, `GET /auth/me`, `POST /auth/change-pin` | all | Session |
| `GET /medicines?q=&categoryId=&filter=low\|expiring` | all | Medicines with stock summary and batches |
| `GET/POST /categories` | read: all, write: mgr/admin | |
| `POST /medicines`, `PATCH /medicines/:id` | mgr/admin | |
| `POST /stock` | mgr/admin | Add stock (creates the medicine, category or batch if new) |
| `PATCH /batches/:id` `{useFirst, note, adjustQty, status}` | mgr/admin | Use first, count correction, return or dispose |
| `GET /stock-entries` | mgr/admin | Stock log |
| `GET/POST /patients` | all | Search or create patients (ID is generated automatically) |
| `GET /picks/suggest/:medicineId` | all | Batches in FEFO order |
| `POST /visits` `{patientId, items:[{medicineId, qty}]}` | all | Pickup; stock goes down automatically |
| `GET /visits?date=&from=&to=&userId=&patientId=` | all (employees see only their own) | |
| `GET /reports/today`, `GET /reports/expiry?window=expired\|30\|90` | mgr/admin | |
| `GET /reports/eod?date=`, `GET /reports/eod.pdf?date=` | admin | EOD report (JSON or PDF) |
| `GET/POST/PATCH /users` | admin | Team management |

## Production notes

- Tables are created on first start (`sequelize.sync`). After you change a model, start once with `DB_ALTER=1`, or switch to Sequelize migrations.
- `npm run build` writes static files to `mobile/dist` and `admin-web/dist`. Serve them behind the same domain as the API, or set `VITE_API_URL`.
- Native Android/iOS apps: wrap `mobile/` with Capacitor (`npm i @capacitor/core @capacitor/cli @capacitor/android`, `npx cap init`, set `webDir` to `dist`, `npx cap add android`). Build with `VITE_API_URL=https://your-api/api`.
- The EOD report is not sent automatically yet. To send it, add a scheduled job (for example `node-cron`) that calls `reports.eod()` and delivers it through the WhatsApp Business API or email.
