# CMD AI Adoption Exam 2026 — Problem #4

This is the lightest of the four problems. Ship it fast and ship it deployed.

## What to build

An event registration system.

- Stack: **Next.js** or **Nest.js**, or **Go**. Choose from this not all.
- One repo. User pages, admin pages, and API in the same project.
- Tests. Pick what would matter if this were a real event with real people. Can be any kind of test written by code.

User can:

- Submit a registration form with name, email, phone, and any other fields a real event would ask for.
- Upload multiple supporting documents.
- Set a password at submission time.
- Receive a reference code on submission.
- Return with reference code and password to view their submission.
- Edit any field, replace documents, add new documents.

Admin can:

- Log in with username and password from `.env`.
- See the list of all registrations.
- Click any registration to see its details.
- Download a name tag PDF for any registration.

## Deployment

- Deploy anywhere. Vercel, Railway, Fly, Render, your own VPS.
- The senior opens the URL, submits a registration with files, comes back with the reference code, edits something, opens the admin page, and downloads a tag. If all of that works, you pass the URL check.

## What to deliver

- The deployed URL.
- The code, shown to the senior at your seat.
- Tests.

## คำที่ต้องเข้าใจให้ตรงกัน

- **Reference code** — รหัสที่ระบบให้ผู้ใช้หลังลงทะเบียน ใช้กลับเข้ามาแก้ไขได้
- **Tag** — ป้ายชื่อผู้ลงทะเบียน (ในที่นี้คือ PDF ไม่ใช่กระดาษจริง)

---

## Implementation

This repo implements the event registration system as a single Next.js app with user pages, admin pages, and API routes in the same project.

### Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS
- Prisma + SQLite
- bcryptjs for participant password hashing
- Signed HTTP-only cookies for participant/admin sessions
- Local file storage under `uploads/`
- PDFKit for name tag PDF generation
- Vitest for focused tests

### Local setup

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Open `http://localhost:3000`.

Default local admin credentials from `.env`:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin12345
```

Change these before deployment.

### Required environment variables

```text
DATABASE_URL="file:./dev.db"
SESSION_SECRET="replace-with-a-long-random-secret"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-me"
NEXT_PUBLIC_APP_NAME="CMD Event Registration"
BLOB_READ_WRITE_TOKEN=""
BLOB_ACCESS="private"
```

For Vercel production, connect a Vercel Blob store to the project so
`BLOB_READ_WRITE_TOKEN` is set. Without it, Vercel only has ephemeral `/tmp`
storage and registrations may not appear across different routes.

### Main flows

1. User opens `/register`, submits registration details, sets a password, and uploads multiple supporting documents.
2. System returns a `referenceCode`.
3. User opens `/lookup`, enters `referenceCode` and password, then views or edits their submission.
4. User can add more documents or replace all existing documents.
5. Admin opens `/admin/login` and logs in using `.env` credentials.
6. Admin opens `/admin/registrations`, reviews all submissions, opens details, downloads documents, and downloads a PDF name tag.

### Useful commands

```bash
npm run dev
npm run type-check
npm run test
npm run build
```

### Deployment note

The app uses SQLite and local file storage for local development. On Vercel,
it uses Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured, storing both
registration metadata and uploaded documents in Blob storage. Deployments
without a persistent storage integration will show a warning in the admin list.
