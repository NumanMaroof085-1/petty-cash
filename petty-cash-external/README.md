# Industrad Petty Cash

Standalone Next.js and TypeScript app for employee expenses, Finance cash movements, and Contact administration. The company can host the app on a Node.js service. The server connects to Dataverse and Power Automate with a company-managed application identity.

## Run the demo

Use Node.js 24 or later. In PowerShell, from this directory:

```powershell
npm ci
npm run seed
$env:PC_DEMO = '1'
npm run dev
```

Open [Activate account](http://127.0.0.1:3000/activate). The seed command prints a synthetic email and a 24-hour activation code for each of the Employee, Finance, and Admin accounts. Enter a test password of at least 12 characters, then sign in. The SQLite database is in `.local`. Use synthetic data in this mode. Approvals and email delivery require the tenant setup.

- Employee. Submit expense lines and a PDF, or convert several receipt images into one PDF. Review status, download your receipts, and answer reviewer questions on My Requests.
- Finance. View the ledger for employees in your branch, record advances and returns, and see the resulting signed balance. Another Finance user handles movements on your account.
- Admin. Create Contacts with a department, manager, and branch, then issue a one-time sign-in invitation. The app defaults to your own branch for administration.

## Deploy to the company environment

Follow the [Dataverse and flow setup](docs/dataverse-deployment.md) and use [.env.example](.env.example) as the server configuration reference. The application is implemented and the live rollout requires a Dataverse environment, adapted flows, and company acceptance testing. Business Central mapping remains with the company’s existing approval flow.

Local checks:

```powershell
npm test
npm run build
npm run check
```
