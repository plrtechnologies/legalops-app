# User Workflows

This document describes the key user workflows in the LegalOps platform, organized by user role.

---

## 1. End-to-End Opinion Request Workflow

This is the primary workflow that involves all user roles.

```
End Customer (Borrower) approaches Law Firm (referred by Bank)
        |
        v
[Paralegal] Creates Opinion Request
        |   - Links Bank Client (e.g. HDFC Bank)
        |   - Links End Customer (Borrower)
        |   - Sets loan type, amount, property location
        |   - Selects bank-specific opinion template
        |
        v
[Paralegal] Uploads Documents
        |   - Title Deeds, Sale Agreements, EC, etc.
        |   - Documents may be in regional languages
        |
        v
[System] Automatic Document Processing
        |   - OCR text extraction (multilingual)
        |   - Language detection
        |   - Translation to English (if regional language)
        |   - AI-powered data extraction (Sarvam AI)
        |
        v
[Firm Admin / Senior Advocate] Assigns Lawyer
        |
        v
[Panel Advocate] Reviews Documents & Generates Opinion
        |   - Clicks "Generate AI Draft" for LLM-assisted drafting
        |   - AI uses extracted data + bank template to populate all fields
        |   - Lawyer reviews, edits, and refines the draft
        |   - Submits for review
        |
        v
[Senior Advocate / Firm Admin] Reviews Opinion
        |   - Approves, or
        |   - Requests changes (with comments)
        |
        v
[Senior Advocate / Firm Admin] Issues Final Opinion
        |
        v
[System] Sends Notifications (configurable per bank)
        - Bank Client notified (if enabled)
        - End Customer notified (if enabled)
```

### Status Flow

| Opinion Request Status | Trigger |
|---|---|
| `DRAFT` | Created by paralegal/advocate |
| `DOCUMENTS_PENDING` | Awaiting document uploads |
| `UNDER_REVIEW` | Documents uploaded, under lawyer review |
| `OPINION_DRAFTED` | Draft opinion created |
| `FINAL` | Opinion issued |
| `REJECTED` | Request rejected |

| Opinion Status | Trigger |
|---|---|
| `DRAFT` | Created manually or via AI generation |
| `SUBMITTED_FOR_REVIEW` | Advocate submits for senior review |
| `CHANGES_REQUESTED` | Reviewer requests modifications |
| `APPROVED` | Senior advocate/admin approves |
| `ISSUED` | Final opinion issued, notifications sent |

---

## 2. Login & Tenant Branding Workflow

![Login Page](images/01-login.png)

1. User navigates to `https://app.legalops.com?code=SHARMA` (or `?slug=sharma-associates`)
2. System fetches tenant branding via public API (no auth required): logo, colors, firm name
3. Login page displays branded UI with firm logo and colors
4. User clicks "Sign in with Keycloak"
5. Keycloak handles authentication (supports SSO with firm's IdP via identity brokering)
6. JWT token returned with `tenant_id` claim
7. User redirected to Dashboard with full tenant branding applied

---

## 3. Dashboard Workflow

![Dashboard](images/02-dashboard.png)

After login, users land on the Dashboard showing role-appropriate widgets:

| Widget | Visible To |
|---|---|
| Total Requests | All roles |
| Pending Assignments | All roles |
| Opinions This Month | All roles |
| Issued This Month | All roles |
| Documents Processed | All roles |
| Average TAT (Days) | All roles |
| My Pending Work | Panel Advocate, Senior Advocate |
| Status Breakdown | All roles |

---

## 4. Opinion Request Management

### 4a. Creating an Opinion Request

![Opinion Requests List](images/03-opinion-requests.png)

1. User clicks "New Request" on the Opinion Requests page
2. Fills in the form:
   - **Reference Number** (unique per tenant, e.g. `OP-2026-0001`)
   - **Bank Client** (dropdown of configured banks)
   - **End Customer / Borrower** (filtered by selected bank)
   - **Loan Type**, Amount, Property Location
   - **Opinion Template** (bank-specific template, optional)
   - **Priority** (Low / Normal / High)
   - **Due Date**
3. Request created in `DRAFT` status

### 4b. Opinion Request Detail

![Opinion Request Detail](images/04-opinion-request-detail.png)

The detail page shows:
- Request metadata (bank, borrower, loan details)
- **Documents tab**: Upload, view status (Pending/Processing/Processed/Failed), preview
- **Opinions tab**: Create new drafts, view opinion versions and their status

---

## 5. Document Management Workflow

### 5a. Document Upload

![Document Upload](images/05-document-upload.png)

1. On the Opinion Request Detail page, click "Upload document"
2. Select file (PDF, image, etc.) — supports documents in regional languages
3. System automatically processes:
   - **OCR**: Extracts text (multilingual support: Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Bengali)
   - **Language Detection**: Identifies document language via LLM
   - **Translation**: If non-English, translates to English preserving legal terms
   - **Data Extraction**: Extracts structured fields (property details, parties, dates, amounts)
4. Document status transitions: `PENDING` -> `PROCESSING` -> `PROCESSED` (or `FAILED`)

### 5b. Document Viewer

![Document Viewer](images/06-document-viewer.png)

- Click "View" on any uploaded document
- **PDFs**: Rendered in-app via iframe with signed URL
- **Images**: Displayed directly with signed URL
- **Other files**: Download link provided

---

## 6. Opinion Drafting & AI Generation Workflow

![Opinion Editor](images/07-opinion-editor.png)

### Manual Drafting
1. Click "New opinion draft" on the request detail page
2. Fill in opinion sections:
   - Summary Findings
   - Title Chain Analysis
   - Encumbrance Analysis
   - Risk Observations
   - Final Opinion
   - Recommendation (Positive / Negative / Conditional)
   - Conditions (if conditional)
3. Click "Save Draft"

### AI-Assisted Drafting
1. Create a new opinion draft (or open existing DRAFT)
2. Click **"Generate AI Draft"** button
3. System calls configured LLM (OpenAI GPT-4 / Anthropic Claude / Google Gemini):
   - Gathers all processed documents' extracted data and OCR text
   - Loads the bank-specific opinion template
   - Builds a comprehensive prompt with loan details, property info, document data
   - LLM generates structured opinion with all sections filled
4. AI-generated fields populate the form automatically
5. Lawyer reviews, edits, and refines as needed
6. Opinion marked as "AI Generated" with a badge

### Review & Approval Flow
1. **Submit for Review**: Advocate submits → status becomes `SUBMITTED_FOR_REVIEW`
2. **Review**: Senior advocate reviews:
   - **Approve** → status becomes `APPROVED`
   - **Request Changes** → adds review comments, status becomes `CHANGES_REQUESTED`
3. If changes requested, advocate edits and re-submits
4. **Issue**: After approval, firm admin/senior advocate issues the final opinion
5. **Notifications**: System automatically emails bank client and/or end customer (configurable per bank)

---

## 7. User Management Workflow (Firm Admin)

![User Management](images/08-user-management.png)

Firm admins can manage their tenant's users:

1. Navigate to **Users** in the sidebar
2. View all users: name, email, role, active status, last login
3. **Add User**: Provide Keycloak ID, email, name, and assign role
4. **Edit User**: Change role, first/last name, activate/deactivate
5. **Deactivate**: Soft-disable a user's access

### Available Roles

| Role | Permissions |
|---|---|
| **Firm Admin** | Full access: manage users, bank clients, settings, all opinions |
| **Senior Advocate** | Create/assign requests, draft/review/approve/issue opinions |
| **Panel Advocate** | Create requests, draft/submit opinions |
| **Paralegal** | Create requests, upload documents, view opinions |
| **Tenant Branding Manager** | Update firm branding only |
| **Super Admin** | Platform-wide: manage tenants |

---

## 8. Master Data Management (Firm Admin)

### Bank Clients
1. Navigate to **Bank Clients** in the sidebar
2. Add bank clients with: code, name, branch, contact info
3. Configure notification settings per bank:
   - **Notify Bank on Completion**: Toggle + optional email template
   - **Notify End Customer on Completion**: Toggle + optional email template
4. Navigate to bank's **Customers** or **Templates** from actions column

### End Customers (per Bank)
1. From a bank client, click "Customers"
2. Add borrowers: name, email, phone, PAN, Aadhaar, address
3. Customers are scoped to their referring bank

### Opinion Templates (per Bank)
1. From a bank client, click "Templates"
2. Create bank-specific opinion templates:
   - Template name, description
   - Loan type (optional — for loan-type-specific templates)
   - Template content (JSON structure defining opinion sections)
   - Mark as default template for the bank
3. Templates are used by the AI to structure generated opinions

---

## 9. Tenant Settings & AI Configuration

![Tenant Settings](images/09-tenant-settings.png)

### Organization Settings
- Firm name, code, slug
- Contact email, phone, address
- Subscription tier, max users

### Branding
- Primary and secondary colors (hex)
- Logo and favicon (upload or external URL)
- Applied across the entire UI for the firm

### AI Settings
- **Auto-extract on upload**: Automatically process documents on upload (default: on)
- **Auto-generate opinion draft**: Automatically generate AI draft when all documents are processed
- **Require lawyer review**: Always require human review before issuing (default: on)
- **Minimum confidence score**: Threshold for auto-extraction quality (0-1)
- **Supported regional languages**: Select which languages to support for translation

---

## 10. Reports & Analytics

![Reports](images/10-reports.png)

### Audit Log
- Full compliance trail of all mutations
- Filterable by: date range, entity type, user
- Shows: entity, action, user, IP address, old/new values diff

### Turnaround Time (TAT)
- Average, min, max days from request creation to opinion issuance
- Grouped by bank client
- Filterable by date range

### Workload
- Per-lawyer breakdown of assigned requests
- Status distribution per lawyer
- Identifies unassigned requests

### Compliance
- Total opinions issued in period
- On-time vs SLA breached count
- On-time percentage
- Based on due date vs actual issuance date
