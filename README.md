# 👜 LPO Warehouse Planner — The Bag Shop

Simple internal LPO (order) planning app for Apples / The Bag Shop staff.
The salesman creates LPOs and sends them to the warehouse; the warehouse team
packs, loads, delivers and finishes them; the admin sees and controls everything.

**Not included by design:** no ecommerce, no checkout, no customer login,
no stock tracking, no CRM.

Tech stack: **Next.js 15 + React 19 + Tailwind CSS + SQLite (Prisma)** — everything
runs locally, no external services needed.

---

## Setup instructions

Node.js 18+ is required. On this machine a portable Node 22 is already installed
at `~/.local/node` (no Homebrew needed).

```bash
# 1. Put node on your PATH (skip if you already have Node installed)
export PATH="$HOME/.local/node/bin:$PATH"

# 2. Install dependencies (already done if node_modules exists)
cd ~/Downloads/warehouse-planner
npm install

# 3. Create the database and load sample data (already done — dev.db exists)
npx prisma migrate dev --name init
npx prisma db seed

# 4. Start the app
npm run dev        # or: ./dev.sh
```

Then open **http://localhost:3000** — on a phone on the same Wi-Fi, open
`http://<computer-ip>:3000`.

To reset the sample data at any time: `npx prisma db seed` (wipes and reloads everything).

---

## Login details (sample users)

| Role      | Email                 | Password     |
| --------- | --------------------- | ------------ |
| Admin     | admin@bagshop.com     | admin123     |
| Salesman  | sales@bagshop.com     | sales123     |
| Warehouse | warehouse@bagshop.com | warehouse123 |

### Who can do what

- **Admin** — everything: create/edit any LPO, update any status, see all
  amounts and payment info, History, Activity Log.
- **Salesman** — creates LPOs and sends them to the warehouse; edits LPOs
  **he created**; sees all LPO statuses and amounts.
- **Warehouse** — cannot edit anything. Sees only what he needs on each LPO:
  customer name, delivery location, bill number, delivery date, items to pack
  and notes. The **amount is shown only for Cash On Delivery** (a big orange
  "collect from customer" banner). He updates the status as work progresses
  and finishes the LPO when delivered.

---

## The LPO workflow

1. **Salesman creates an LPO** (+ New LPO):
   customer name, bill number, delivery location (address), delivery date,
   payment (Paid / Cash On Delivery), item codes + quantities (add as many
   rows as needed), optional notes.
   - Choosing **Cash On Delivery** pops up an extra field: *amount to collect
     on delivery*. Choosing Paid hides it — no amount is entered or shown.
2. The LPO lands with the warehouse team as **Pending**.
3. **Warehouse updates progress** from his phone:
   `Pending` (grey) → `Packing In Progress` (yellow) → `Loaded On Truck` (orange)
   → `Delivered` (green).
4. Marking **Delivered ends the LPO** — it disappears from the open lists and
   moves to **History**.
5. Every status change is saved to the **Activity Log** automatically
   (LPO, who changed it, old → new status, date/time, optional note).

### Screens

- **Dashboard** — counters: Deliveries Today, New LPOs Today, Pending,
  Packing In Progress, Loaded On Truck, Delivered Today; plus tables for
  overdue / today / tomorrow / delivered-today. The warehouse user sees the
  same dashboard with the limited columns.
- **LPOs** — all open LPOs with search + filters (status, delivery date,
  customer, bill number, salesman).
- **Deliveries** — open LPOs grouped by delivery date with Today / Overdue badges.
- **History** — finished (delivered) LPOs, searchable.
- **Activity Log** (admin only) — every status change, newest first.
- Each LPO page shows its own status history.

---

## Database schema (SQLite via Prisma — `prisma/schema.prisma`)

**users** — id, name, email (unique), passwordHash (bcrypt),
role (`ADMIN` | `SALESMAN` | `WAREHOUSE_KEEPER`), createdAt.

**lpos** — id (shown as `LPO-0001`), billNumber, customerName,
deliveryLocation, deliveryDate (`YYYY-MM-DD`), paymentType (`Paid` |
`Cash On Delivery`), codAmount (only for COD), notes, status, createdById →
users, createdAt, updatedAt.

**lpo_items** — id, lpoId → lpos, itemCode, quantity. One LPO has many item lines.

**activity_logs** — id, lpoId → lpos, changedById → users, oldStatus,
newStatus, notes, createdAt.

Sample data: the 3 users above + 10 LPOs (today / tomorrow / finished) with
item lines, COD and Paid examples, and realistic status history.

---

## Project layout

```
app/
  page.tsx            Dashboard (role-aware counters + today/tomorrow lists)
  lpos/page.tsx       Open LPOs (search + filters)
  lpos/new/page.tsx   New LPO form (salesman/admin) — items + COD toggle
  lpos/[id]/page.tsx  LPO detail: role-based fields, status updater, edit, history
  deliveries/page.tsx Open LPOs grouped by delivery date
  history/page.tsx    Finished LPOs
  activity/page.tsx   Activity Log (admin only)
  login/page.tsx      Staff login
  actions.ts          Server actions (login, create/update LPO, update status)
components/           LpoForm (client), LpoTable, badges, nav
lib/                  db client, cookie session auth, statuses/colours
prisma/               schema, migrations, seed script, dev.db (SQLite file)
```
