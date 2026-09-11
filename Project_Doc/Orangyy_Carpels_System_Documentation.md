# Orangyy Carpels — Comprehensive System & Implementation Specification
**Document Version:** 1.0 (Phase G V1 Production Build)  
**Date:** September 2026  
**Application Name:** Orangyy Carpels (Studio OS)  
**Classification:** Internal Technical Architecture & Functional Specification  

---

## 1. Executive Summary & System Overview

### 1.1 Overview
**Orangyy Carpels** is an enterprise resource, project, timesheet, HR, and billing management platform engineered specifically for design studios and project-based consulting organizations. The platform bridges the gap between daily creative operations, resource utilization, project delivery, timesheet compliance, leave management, and multi-currency billing.

### 1.2 Core Capabilities
1. **Human Resources & Employee Registry:** Comprehensive employee lifecycle records, roles (Super Admin, Project Manager, Employee), cost rates, weekly capacities, education, experience, and biometric/tax metadata.
2. **Client & CRM Management:** Client entity registry with legal identities (GSTIN, PAN, CIN, MSME), primary and accounts contact persons, preferred billing currencies, and payment terms (`dueTime`).
3. **Project Management & Rate Versioning:** Flexible project accounting supporting Time & Material (**T&M**), Fixed Monthly Resource Cost (**Fixed RC**), and Fixed Project Cost (**Fixed PC**), with effective-dated rate versioning and monthly locked budget hours.
4. **Monthly & Daily Timesheet Engine:** Project-centric daily timesheet logging system with billable/non-billable categorization, standard studio task taxonomy (Ideation, Design, AI Design, Validation, Analysis, Approval), inline debounced auto-saving, and dual-level approval workflows (**Draft $\rightarrow$ Submitted $\rightarrow$ PM_Approved $\rightarrow$ Approved**).
5. **Leave & Attendance Engine:** Automated leave management supporting Casual Leave (CL), Sick Leave (SL), Earned Leave (EL), Work From Home (WFH), Comp-Offs, and Optional Holidays with annual quotas, monthly accruals, half-day sessions, and multi-tier approval chains.
6. **Billing & Multi-Currency Engine:** Real-time multi-currency exchange rate synchronization (live via `open.er-api.com` with INR normalization), automated revenue calculations for T&M and Fixed billing, fiscal year (FY April–March) filtering, and budget vs. actual utilization reports.
7. **Role-Based Access Control (RBAC):** Strict 3-tier authorization model guarding financial records, studio settings, and approval actions.

### 1.3 Tech Stack & Runtime Specifications

| Layer | Technology | Details / Notes |
| :--- | :--- | :--- |
| **Frontend UI** | React 18 + Vite | Single Page Application (SPA), React Router v6 |
| **Styling** | Tailwind CSS | Dylan Field (Figma) inspired minimalist UI, custom design tokens |
| **Language** | TypeScript | End-to-end type safety across client and server |
| **Backend API** | Node.js + Fastify | High performance modular monolith, JSON Schema validation |
| **ORM** | Prisma ORM | Prisma Client with custom MySQL database provider |
| **Database** | MySQL 8.0 | 100% unified schema across Local and Production environments |
| **Authentication**| Cookie-based Sessions | Signed HTTP-only session cookies with salted scrypt hashing |
| **External APIs** | open.er-api.com | Live multi-currency exchange rate synchronization |
| **Process Manager**| PM2 | Zero-downtime cluster mode and daemon management |
| **Web Server** | Nginx | Reverse proxy, SSL termination, and static asset serving |

---

## 2. Database Architecture & Schema Specification

The database is built on **MySQL 8.0** and managed using **Prisma ORM**. The data models are optimized with normalized relational keys and embedded JSON structures for high-performance sub-document querying.

```
+-----------------------------------------------------------------------------------+
|                                  DATABASE SCHEMA                                  |
+-----------------------------------------------------------------------------------+

       +--------------------+                    +---------------------+
       |      Employee      |                    |       Client        |
       +--------------------+                    +---------------------+
       | employeeId (PK)    |                    | id (PK)             |
       | email (Unique)     |                    | name                |
       | role               |                    | billingCurrency     |
       | costRate           |                    | defaultBillingType  |
       | casualQuota/Used   |                    | dueTime             |
       | sickQuota/Used     |                    +----------+----------+
       | compOffBalance     |                               |
       | education (Json)   |                               | 1:N
       | experience (Json)  |                               v
       +---------+----------+                    +---------------------+
                 |                               |       Project       |
                 | 1:N                           +---------------------+
                 | (Logic)                       | id (PK)             |
                 v                               | clientId (FK)       |
       +--------------------+                    | billingType         |
       |    LeaveRequest    |                    | rate / currency     |
       +--------------------+                    | monthlyBudgets(Json)|
       | id (PK)            |                    | rateVersions (Json) |
       | employeeId         |                    +----------+----------+
       | leaveType          |                               |
       | daysCount          |                               | 1:N
       | pmApproval         |                               v
       | saApproval         |                    +---------------------+
       | status             |                    | DailyTimesheetEntry |
       +--------------------+                    +---------------------+
                                                 | id (PK)             |
       +--------------------+                    | projectId (FK)      |
       |    ExchangeRate    |                    | employeeId          |
       +--------------------+                    | date (YYYY-MM-DD)   |
       | currency           |                    | hours               |
       | rateToINR          |                    | task / isBillable   |
       | monthYear          |                    | status              |
       +--------------------+                    +---------------------+
```

### 2.1 Complete Model Dictionary

#### 2.1.1 `Employee` Model
Represents team members, managers, and super administrators with comprehensive HR metadata and leave quotas.

| Field Name | Type | Modifiers / Default | Description |
| :--- | :--- | :--- | :--- |
| `employeeId` | `String` | `@id` | Unique Employee Code (e.g. `EMP001`, `EMP014`) |
| `fullName` | `String` | Required | Legal full name |
| `dob` | `String?` | `@default("")` | Date of birth (YYYY-MM-DD) |
| `designation` | `String` | `@default("Team Member")` | Professional title (e.g., UI/UX Designer, Lead) |
| `department` | `String` | `@default("General")` | Department (Design, Engineering, Management) |
| `email` | `String` | `@unique` | Corporate email address |
| `password` | `String?` | `@default("")` | Salted `scrypt` password hash |
| `personalEmail` | `String?` | `@default("")` | Secondary/personal email address |
| `phone` | `String` | Required | Primary phone / mobile number |
| `secondaryPhone` | `String?` | `@default("")` | Emergency / alternate phone number |
| `permanentAddress`| `String?` | `@default("")` | Permanent residential address |
| `gender` | `String?` | `@default("Not Specified")` | Gender identification |
| `guardianName` | `String?` | `@default("")` | Father's or Guardian's full name |
| `motherName` | `String?` | `@default("")` | Mother's full name |
| `bloodGroup` | `String?` | `@default("")` | Blood group (e.g. `O+`, `B+`, `A-`) |
| `linkedInUrl` | `String?` | `@default("")` | Public LinkedIn profile URL |
| `aadhaarNumber` | `String?` | `@default("")` | Indian Aadhaar National ID number |
| `panNumber` | `String?` | `@default("")` | Permanent Account Number (PAN) |
| `costRate` | `String` | `@default("₹0/hr")` | Internal billing/cost rate per hour |
| `capacity` | `String` | `@default("40 hrs/week")` | Standard weekly working capacity |
| `joiningDate` | `String?` | `@default("")` | Date of joining (YYYY-MM-DD) |
| `relievingDate` | `String?` | `@default("")` | Date of exit / relieving |
| `status` | `String` | `@default("Active")` | `Active` or `Inactive` |
| `role` | `String` | `@default("Employee")` | `Super Admin`, `Project Manager`, or `Employee` |
| `location` | `String` | `@default("Delhi, India")`| Physical office location or base city |
| `avatar` | `String?` | `@db.LongText` | Base64 encoded profile image / avatar string |
| `education` | `Json?` | Optional | Array: `[{ degree: string, school: string, year: string }]` |
| `experience` | `Json?` | Optional | Array: `[{ company: string, role: string, period: string }]` |
| `leaveYear` | `Int` | `@default(2026)` | Current fiscal/calendar leave accounting year |
| `casualQuota` | `Float` | `@default(12)` | Annual Casual Leave allotment (days) |
| `casualUsed` | `Float` | `@default(0)` | Casual Leave days consumed |
| `sickQuota` | `Float` | `@default(12)` | Annual Sick Leave allotment (days) |
| `sickUsed` | `Float` | `@default(0)` | Sick Leave days consumed |
| `earnedQuota` | `Float` | `@default(15)` | Annual Earned/Privilege Leave allotment |
| `earnedUsed` | `Float` | `@default(0)` | Earned Leave days consumed |
| `compOffBalance` | `Float` | `@default(0)` | Earned Compensatory Off balance (days) |
| `compOffRequests`| `Json?` | Optional | Array: `[{ id, workedDate, hoursWorked, daysCredit, reason, status, pmApproval, saApproval, createdAt }]` |
| `optionalHolidaysQuota` | `Int` | `@default(2)` | Optional holidays allowed per calendar year |
| `optionalHolidaysUsed` | `Int` | `@default(0)` | Optional holidays taken |
| `wfhMonthlyLimit` | `Int` | `@default(2)` | Max permitted Work From Home days per month |
| `wfhUsedThisMonth` | `Int` | `@default(0)` | WFH days utilized in active month |
| `lastAccruedMonth` | `String?` | `@default("")` | Timestamp of last automatic monthly accrual |

#### 2.1.2 `Client` Model
Represents client accounts, corporate tax entities, and billing terms.

| Field Name | Type | Modifiers / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id` | Client Unique Identifier (e.g. `CLI-001`) |
| `name` | `String` | Required | Primary client brand / commercial name |
| `legalName` | `String?` | `@default("")` | Registered legal enterprise name |
| `displayName` | `String?` | `@default("")` | Short display alias for UI badges |
| `contactPerson` | `String?` | `@default("")` | Primary stakeholder / point of contact |
| `email` | `String?` | `@default("")` | Official contact email |
| `phone` | `String?` | `@default("")` | Official contact telephone number |
| `accountsPerson`| `String?` | `@default("")` | Invoicing & finance contact name |
| `accountsEmail` | `String?` | `@default("")` | Invoicing & accounts payable email |
| `accountsPhone` | `String?` | `@default("")` | Invoicing contact telephone number |
| `address` | `String?` | `@default("")` | Corporate office address |
| `country` | `String?` | `@default("India")` | Client country of incorporation |
| `cinNumber` | `String?` | `@default("")` | Corporate Identification Number (CIN) |
| `gstNumber` | `String?` | `@default("")` | Goods and Services Tax Identification (GSTIN) |
| `panNumber` | `String?` | `@default("")` | Indian Tax Permanent Account Number (PAN) |
| `msmeNumber` | `String?` | `@default("")` | Micro, Small and Medium Enterprises reg. |
| `billingCurrency`| `String` | `@default("USD ($)")` | Default invoicing currency (USD, INR, EUR, etc.) |
| `defaultBillingType`| `String` | `@default("T&M")` | `T&M`, `Fixed RC`, or `Fixed PC` |
| `dueTime` | `String` | `@default("30 days")` | Credit payment term (`15 days`, `30 days`, `45 days`, `60 days`, `90 days`) |
| `status` | `String` | `@default("Active")` | `Active` or `Inactive` |
| `projects` | `Project[]`| Relation | Cascading relation to associated projects |

#### 2.1.3 `Project` Model
Represents client projects, fee models, resource assignments, and monthly budget allocations.

| Field Name | Type | Modifiers / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id` | Project Code (e.g. `PRJ-001`) |
| `name` | `String` | Required | Project Title |
| `billingType` | `String` | Required | `T&M`, `Fixed RC`, or `Fixed PC` |
| `rate` | `String` | Required | Formatted rate string (e.g. `$50/hr`, `₹1,50,000/mo`) |
| `currency` | `String` | `@default("USD ($)")` | Billing currency |
| `businessLine` | `String?` | `@default("")` | Associated business domain (e.g., UI/UX, AI Consulting) |
| `service` | `String?` | `@default("")` | Sub-service classification |
| `startDate` | `String?` | `@default("")` | Engagement kickoff date |
| `endDate` | `String?` | `@default("")` | Target or actual completion date |
| `budgetHours` | `Int` | `@default(0)` | Active monthly budget hours allocation |
| `loggedHours` | `Int` | `@default(0)` | Total historical hours logged on project |
| `status` | `String` | Required | `Active` or `Inactive` |
| `managerId` | `String?` | `@default("")` | Designated Project Manager employee ID |
| `managerName` | `String?` | `@default("")` | Name of designated Project Manager |
| `assignedEmployees`| `String?`| `@default("")` | Comma-separated list of assigned Employee IDs/Names |
| `clientId` | `String` | Foreign Key | References `Client.id` with `onDelete: Cascade` |
| `monthlyBudgets`| `Json?` | Optional | Array: `[{ monthYear: string, budgetHours: number, isLocked: boolean, updatedAt: string }]` |
| `rateVersions` | `Json?` | Optional | Array: `[{ id: number, billingType: string, rateAmount: number, currency: string, effectiveStartDate: string, effectiveEndDate: string, notes: string, createdAt: string }]` |
| `dailyEntries` | `DailyTimesheetEntry[]` | Relation | Cascading relation to all daily time entries |

#### 2.1.4 `DailyTimesheetEntry` Model
Atomic unit of daily work logged by employees on specific projects.

| Field Name | Type | Modifiers / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `date` | `String` | Required | Date in `YYYY-MM-DD` format (e.g. `2026-08-17`) |
| `dayLabel` | `String` | Required | Formatted day string (e.g. `Aug 17, Mon`) |
| `sno` | `String` | Required | Two-digit day index string (e.g. `01`, `17`) |
| `description` | `String` | `@default("")` | Detailed work description |
| `task` | `String` | `@default("")` | Studio task category (`Ideation`, `Design`, `AI Design`, `Validation`, `Analysis`, `Approval`) |
| `hours` | `Float` | `@default(0)` | Decimal hours logged (0.25 to 24.0) |
| `isBillable` | `Boolean`| `@default(true)` | Billable vs Non-Billable indicator |
| `projectId` | `String` | Foreign Key | References `Project.id` (`onDelete: Cascade`) |
| `employeeId` | `String?`| `@default("")` | Employee ID who logged the work |
| `weekStart` | `String` | Required | Start of the week date (`YYYY-MM-DD`) |
| `status` | `String` | `@default("Draft")` | Workflow state: `Draft`, `Submitted`, `PM_Approved`, `Approved` |
| `createdAt` | `DateTime`| `@default(now())` | Record creation timestamp |
| `updatedAt` | `DateTime`| `@default(now()) @updatedAt` | Automatic timestamp of last update |

> **Unique Constraint:** `@@unique([projectId, date, employeeId])` ensures an employee cannot have duplicate overlapping records for the exact same project and date.

#### 2.1.5 `LeaveRequest` Model
Captures employee time-off and work-from-home applications and multi-tiered approvals.

| Field Name | Type | Modifiers / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `employeeId` | `String` | Required | Submitting employee ID |
| `employeeName` | `String` | Required | Submitting employee full name |
| `leaveType` | `String` | Required | `Casual Leave`, `Sick Leave`, `Earned Leave`, `Comp-off`, `Work From Home`, `Optional Holiday` |
| `startDate` | `String` | Required | Start date (`YYYY-MM-DD`) |
| `endDate` | `String` | Required | End date (`YYYY-MM-DD`) |
| `isHalfDay` | `Boolean`| `@default(false)` | Half-day leave flag |
| `halfDaySession`| `String?`| Optional | `First Half` or `Second Half` |
| `daysCount` | `Float` | Required | Total business days count (`0.5`, `1.0`, `2.0`, etc.) |
| `reason` | `String` | Required | Justification submitted by employee |
| `status` | `String` | `@default("Pending")` | Lifecycle: `Pending_PM`, `Pending_SA`, `Approved`, `Rejected`, `Cancelled` |
| `approverId` | `String?`| Optional | Employee ID of approving manager/admin |
| `approverName` | `String?`| Optional | Full name of approver |
| `pmApproval` | `String?`| `@default("Pending")` | Project Manager approval stage: `Pending`, `Approved`, `Rejected` |
| `saApproval` | `String?`| `@default("Pending")` | Super Admin approval stage: `Pending`, `Approved`, `Rejected` |
| `rejectionReason`| `String?`| Optional | Remarks entered upon rejection |
| `appliedAt` | `DateTime`| `@default(now())` | Application timestamp |
| `updatedAt` | `DateTime`| `@default(now()) @updatedAt`| Last update timestamp |

#### 2.1.6 `ExchangeRate` Model
Maintains monthly normalized exchange rates against Indian Rupee (INR) for accurate multi-currency studio billing.

| Field Name | Type | Modifiers / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `currency` | `String` | Required | 3-letter currency code (e.g. `USD`, `EUR`, `GBP`, `AED`, `SGD`, `CAD`, `JPY`, `CHF`, `INR`) |
| `rateToINR` | `Float` | Required | Multiplier converting 1.0 unit of Currency to INR |
| `monthYear` | `String` | Required | Active billing month in `YYYY-MM` format |
| `isLocked` | `Boolean`| `@default(false)` | Lock flag once month closes |
| `fetchedAt` | `DateTime`| `@default(now())` | Retrieval timestamp |
| `source` | `String` | `@default("online")` | Data origin (`open.er-api.com` or `studio-default`) |

#### 2.1.7 Supplementary Models (`BusinessLine`, `Service`, `Holiday`, `LeaveTypeConfig`, `Notification`, `Timesheet`, `TimesheetRow`)
- **`BusinessLine` & `Service`:** Hierarchical service classification system.
- **`Holiday`:** Calendar list of Mandatory and Optional holidays for the organization.
- **`LeaveTypeConfig`:** Master policy rules defining annual quotas, monthly accrual rates, half-day eligibility, and carry-forward rules per leave code (`CL`, `SL`, `EL`, `WFH`, `OH`).
- **`Notification`:** System notifications for timesheet submissions, approvals, reopenings, project assignments, and leave status updates.
- **`Timesheet` & `TimesheetRow`:** Weekly legacy matrix storage.

---

## 3. Core Modules & Business Logic

### 3.1 Authentication & Session Security Module
- **Mechanism:** Signed, HTTP-only cookie-based sessions. Cookie name: `sessionId`.
- **Session Lifecycle:** Managed via memory map `AuthService.sessions` and verified on every API request via Fastify's `preHandler` hook.
- **Password Security:** Salted `scrypt` hashing via Node.js native `crypto.scryptSync`. Backward-compatible fallback for plaintext password transition.
- **Role Context Injection:** On successful session resolution, `request.user` is populated with `{ id, employeeId, fullName, email, role, avatar }` and made available to downstream services.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant API as Fastify Server
    participant Auth as AuthService
    participant DB as MySQL (Prisma)

    User->>API: POST /api/auth/login { email, password }
    API->>Auth: AuthService.login(email, password)
    Auth->>DB: prisma.employee.findUnique({ where: { email } })
    DB-->>Auth: Employee Record
    Auth->>Auth: Verify scrypt password hash
    Auth->>Auth: Generate secure 32-byte crypto sessionId
    Auth-->>API: UserSession Context
    API-->>User: HTTP 200 + Set-Cookie: sessionId (HttpOnly, Secure)
```

### 3.2 Employee & HR Registry Module
- **Access Control:** Super Admin and Project Manager have view access; Super Admin has write/edit/delete authority.
- **Cost Rate & Capacity:** Associates cost rate per hour (e.g. `₹1,200/hr`) and weekly capacity (e.g. `40 hrs/week`) to compute resource utilization efficiency.
- **Automatic ID Generator:** Automatically sequences IDs (`EMP001`, `EMP002`, ...) if not provided manually.
- **Education & Experience JSON Handling:** Stores structured career history in embedded JSON fields.

### 3.3 Client Registry & CRM Module
- **Entity Identification:** Generates distinct client IDs (`CLI-001`).
- **Statutory Metadata:** Captures Indian GSTIN, PAN, CIN, and MSME numbers for statutory invoicing.
- **Multi-Currency & Due Times:** Defines client-specific base currency and payment grace periods (`15`, `30`, `45`, `60`, `90` days).

### 3.4 Project Registry & Budget Allocation Engine
- **Billing Types Supported:**
  1. **Hourly Rate (T&M):** Billed dynamically as `Logged Hours × Hourly Rate`.
  2. **Monthly Resource Cost (Fixed RC):** Fixed recurring monthly cost per assigned resource.
  3. **Project Cost (Fixed PC):** Milestone/lump-sum project fee.
- **Rate Versioning System:**
  - Maintains `rateVersions` JSON array on the Project model.
  - When rate or billing type changes, the previous version's `effectiveEndDate` is stamped, and a new record is prepended with `effectiveStartDate`.
- **Monthly Budget Hours:**
  - Manages `monthlyBudgets` JSON array.
  - Previous months are automatically locked (`isLocked: true`).
  - Current month budget changes update the root `project.budgetHours`.

```mermaid
flowchart TD
    A[Project Rate Update Requested] --> B{Role == 'Super Admin'?}
    B -- No --> C[Throw 403 Forbidden]
    B -- Yes --> D[Fetch Project Rate History]
    D --> E[Set effectiveEndDate on Active Rate]
    E --> F[Prepend New Rate Version Object]
    F --> G[Update prisma.project.update]
    G --> H[Return Updated Rate Version]
```

### 3.5 Timesheets & Time Tracking Engine
The timesheet engine is project-centric and month-partitioned.

```mermaid
stateDiagram-v2
    [*] --> Draft : Employee Logs Hours
    Draft --> Draft : Inline Debounced Auto-Save
    Draft --> Submitted : Slide To Action (Submit)
    
    Submitted --> PM_Approved : Project Manager Approves
    Submitted --> Draft : PM Reopens (Rework)
    
    PM_Approved --> Approved : Super Admin Final Lock
    PM_Approved --> Draft : Super Admin Reopens
    
    Approved --> [*] : Locked into Financial Billing
```

#### Detailed Workflow Rules:
1. **Assignment Validation (`hasProjectAccess`):**
   - Super Admins can access all projects.
   - Project Managers can access projects where `managerId == employeeId` or where they are in `assignedEmployees`.
   - Employees can only view and log time for projects where their `employeeId` is listed in `assignedEmployees`.
2. **Calendar Grid Generation:**
   - Dynamically builds days `01` through `28/30/31` for the selected month.
   - Highlights weekends and public holidays.
3. **Task Taxonomy:**
   - Every daily log entry must be categorized into standard studio tasks: `Ideation`, `Design`, `AI Design`, `Validation`, `Analysis`, `Approval`.
4. **Partial vs Full Project Submission:**
   - Multi-resource projects show status `Partially_Submitted` until all assigned resources submit their logs.
   - PM approval is blocked until all assigned resources have submitted (`Partially_Submitted` prevention).
5. **Logged Hours Synchronization:**
   - Whenever any `DailyTimesheetEntry` is updated, inserted, or status-transitioned, `TimesheetService.syncProjectLoggedHours(projectId)` aggregates all entries and updates `project.loggedHours`.

### 3.6 Leave, Comp-Off & Attendance Engine
- **Quota Balances:**
  - `Casual Leave (CL)`: 12 days / year
  - `Sick Leave (SL)`: 12 days / year
  - `Earned Leave (EL)`: 15 days / year (accrues 1.25 days/month)
  - `Work From Home (WFH)`: 2 days / month limit
  - `Optional Holidays (OH)`: 2 days / year from published studio calendar
  - `Comp-Off`: Earned dynamically by working on weekends/holidays with prior approval
- **Dual Approval Hierarchy:**
  - Employee applications require **PM Approval** first, then escalate to **Super Admin Approval**.
  - PM applications skip PM stage and go directly to **Super Admin Approval**.
  - Approving a leave automatically decrements/increments the corresponding employee balance fields (`casualUsed`, `sickUsed`, `compOffBalance`, etc.).

### 3.7 Billing & Multi-Currency Conversion Engine
- **Exchange Rate Normalization:**
  - Rates against INR are updated monthly via `open.er-api.com/v6/latest/USD`.
  - Fallback rates are embedded in memory if external network connectivity fails.
- **Financial Revenue Computation:**
  $$\text{T\&M Revenue (INR)} = \sum (\text{Logged Hours} \times \text{Hourly Rate Amount} \times \text{ExchangeRateToINR})$$
  $$\text{Fixed RC Revenue (INR)} = \sum (\text{Monthly Rate Amount} \times \text{ExchangeRateToINR})$$
  $$\text{Fixed PC Revenue (INR)} = \sum (\text{Project Cost Amount} \times \text{ExchangeRateToINR})$$
  $$\text{Total Studio Revenue (INR)} = \text{T\&M Revenue} + \text{Fixed RC Revenue} + \text{Fixed PC Revenue}$$
- **Fiscal Year Filtering:**
  - Financial dashboards filter metrics by Indian Financial Year (April 1 to March 31 of following year).

---

## 4. Role-Based Access Control (RBAC) Matrix

| Feature / Action | Employee | Project Manager | Super Admin |
| :--- | :---: | :---: | :---: |
| **View Dashboard (Personal Metrics)** | Yes | Yes | Yes |
| **View Studio Financial Revenue & Billable Totals** | No | Yes | Yes |
| **Log Personal Daily Timesheets** | Yes | Yes | Yes |
| **Submit Monthly Timesheets** | Yes | Yes | Yes |
| **Approve Subordinate Timesheets (PM Stage)** | No | Yes | Yes |
| **Final Lock / Approve Timesheets (SA Stage)** | No | No | Yes |
| **Reopen / Unlock Submitted Timesheets** | No | Yes | Yes |
| **View Employee HR Registry** | No | Yes | Yes |
| **Create / Edit / Terminate Employees** | No | No | Yes |
| **View Client & Project Registries** | No | Yes | Yes |
| **Create / Edit Clients & Projects** | No | No | Yes |
| **Edit Project Rate Versions & Financial Rates** | No | No | Yes |
| **Set Project Monthly Budget Hours** | No | Yes | Yes |
| **Apply for Leave / Comp-off / WFH** | Yes | Yes | Yes |
| **Approve Leave Applications** | No | Yes (PM stage) | Yes (Final) |
| **Configure Leave Rules & Holiday Calendar** | No | No | Yes |
| **Configure Business Lines & Services** | No | No | Yes |

---

## 5. End-to-End User Flows

### 5.1 User Flow 1: Employee Daily Timesheet Logging & Monthly Submission
1. **Login:** Employee logs in with work email and password.
2. **Navigate:** Selects **Timesheets** from navigation sidebar.
3. **Select Period & Project:** Selects the target month (e.g. `2026-08`) and clicks on an assigned project card.
4. **Log Daily Hours:**
   - The interactive 31-day project grid renders.
   - Employee enters hours (e.g., `4.5`), selects task category (`Design`), and enters work details.
   - Frontend auto-saves changes to the backend API (`POST /api/timesheets/daily`) with a 500ms debounce.
5. **Review Month Totals:** Verifies total hours vs allocated budget.
6. **Submit:** Uses the **Slide-to-Submit** drawer. Status transitions to `Submitted`. The sheet locks into read-only mode for the employee.
7. **Notification:** Project Manager receives an in-app notification: *"Timesheet Submitted: PRJ-001 by [Name]"*.

### 5.2 User Flow 2: Project Manager Timesheet Review & Multi-Resource Approval
1. **Navigate to Timesheets:** PM selects the project view.
2. **Review Multi-Resource Grid:**
   - PM inspects daily entries across all assigned team members.
   - Identifies whether all resources have submitted.
3. **Action:**
   - **Case A (Satisfactory):** Clicks **Approve Timesheet (PM)**. Status transitions to `PM_Approved`. Notification dispatched to Super Admin.
   - **Case B (Discrepancy):** Clicks **Reopen Timesheet**. Enters rework remarks. Status reverts to `Draft`. Notification sent to employee.

### 5.3 User Flow 3: Super Admin Final Timesheet Lock & Revenue Generation
1. **Review Pending Timesheets:** Super Admin accesses Dashboard / Timesheets filtering by `PM_Approved`.
2. **Final Approval:** Super Admin verifies billable totals and clicks **Final Approve (Super Admin)**. Status transitions to `Approved`.
3. **Financial Reflection:** The logged hours are finalized, and the **Reports / Billing Overview** calculates exact realized revenue in INR using the active month's locked exchange rates.

### 5.4 User Flow 4: Leave Application & Dual-Tier Approval
1. **Apply:** Employee opens **Leaves $\rightarrow$ Apply Leave**.
2. **Select Type & Dates:** Selects type (e.g. `Casual Leave`), dates, and optional half-day session.
3. **Balance Validation:** Backend validates remaining quota.
4. **Submission:** Record inserted with `status = 'Pending_PM'`.
5. **Tier 1 (PM Review):** Project Manager approves $\rightarrow$ `pmApproval = 'Approved'`, `status = 'Pending_SA'`.
6. **Tier 2 (SA Review):** Super Admin approves $\rightarrow$ `saApproval = 'Approved'`, `status = 'Approved'`.
7. **Quota Deduction:** Prisma transaction updates `Employee.casualUsed += daysCount`.
8. **Calendar Reflection:** Leave dates appear on the **Team Availability Calendar**.

---

## 6. Complete API Catalog & Route Specifications

### 6.1 Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth | Request Body | Response Body / Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | `{ email: string, password: string }` | `{ success: true, user: UserSession }` + Cookie |
| `POST` | `/api/auth/logout` | Session | None | `{ success: true, message: "Logged out" }` |
| `GET` | `/api/auth/me` | Session | None | `{ success: true, user: UserSession }` |

### 6.2 Timesheets Routes (`/api/timesheets`)

| Method | Endpoint | Role | Query / Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/timesheets/summary` | All | `?month=YYYY-MM` | Returns project list, budget hours, logged hours, and submission statuses |
| `GET` | `/api/timesheets/daily` | All | `?projectId=...&month=...` | Returns 31-day entries array, lock status, and assigned team members |
| `POST` | `/api/timesheets/daily` | Assigned | `{ projectId, month, entries: [...] }` | Upserts daily timesheet entries and auto-syncs total project logged hours |
| `POST` | `/api/timesheets/approve` | PM / SA | `{ projectId, month }` | Advances status: `Submitted` $\rightarrow$ `PM_Approved` or `Approved` |
| `POST` | `/api/timesheets/reopen` | PM / SA | `{ projectId, month }` | Reverts status back to `Draft` for rework |

### 6.3 Registries Routes (`/api/registries`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/registries/employees` | PM / SA | List all registered studio employees |
| `POST` | `/api/registries/employees` | SA | Create a new employee record |
| `PUT` | `/api/registries/employees/:id` | SA | Update employee profile, cost rate, or leave quotas |
| `DELETE` | `/api/registries/employees/:id` | SA | Soft-delete or remove employee |
| `GET` | `/api/registries/clients` | PM / SA | List all clients and contact details |
| `POST` | `/api/registries/clients` | SA | Create client enterprise entity |
| `PUT` | `/api/registries/clients/:id` | SA | Update client details or billing terms |
| `DELETE` | `/api/registries/clients/:id` | SA | Delete client entity (cascades to projects) |
| `GET` | `/api/registries/projects` | PM / SA | List all active and archived projects |
| `POST` | `/api/registries/projects` | SA | Create project, link client, assign PM & team |
| `PUT` | `/api/registries/projects/:id` | SA | Update project metadata or team assignments |
| `DELETE` | `/api/registries/projects/:id` | SA | Delete project (cascades to entries) |

### 6.4 Billing & Exchange Rates Routes (`/api/billing`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/billing/summary` | PM / SA | Aggregate revenue (T&M, Fixed RC, Fixed PC in INR) and project breakdowns |
| `GET` | `/api/billing/rates` | PM / SA | List active month exchange rates against INR |
| `POST` | `/api/billing/rates/sync` | SA | Trigger live exchange rate fetch from `open.er-api.com` |
| `GET` | `/api/billing/projects/:id/rate-versions` | PM / SA | Retrieve effective-dated rate history for a project |
| `POST` | `/api/billing/projects/:id/rate-versions` | SA | Create a new effective rate version |
| `GET` | `/api/billing/projects/:id/monthly-budgets` | PM / SA | Retrieve monthly budget history and lock states |
| `POST` | `/api/billing/projects/:id/monthly-budgets` | PM / SA | Set monthly budget hours for a project |

### 6.5 Leaves & Attendance Routes (`/api/leaves`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/leaves/balance` | All | Get caller's leave balances, quotas, and WFH limits |
| `POST` | `/api/leaves/apply` | All | Submit a new leave or WFH application |
| `GET` | `/api/leaves/requests` | All | List personal requests (Employee) or all requests (PM/SA) |
| `POST` | `/api/leaves/requests/:id/action` | PM / SA | Approve or Reject a leave application |
| `GET` | `/api/leaves/attendance-matrix` | All | Team availability calendar showing approved leaves & holidays |
| `GET` | `/api/leaves/configs` | All | Get master leave type policies |
| `POST` | `/api/leaves/configs` | SA | Create custom leave type |
| `PUT` | `/api/leaves/configs/:id` | SA | Update leave type policy rules |
| `DELETE` | `/api/leaves/configs/:id` | SA | Delete custom leave policy |

---

## 7. Frontend UI/UX Architecture

### 7.1 Design System Principles (Dylan Field / Figma Inspired)
- **Minimalist Aesthetic:** Subdued studio gray borders (`#E5E7EB`), light neutral backgrounds (`#F9FAFB`), high contrast typography.
- **Micro-Interactions & Feedback:** Debounced auto-save status pills (`Saving...`, `All changes saved`), animated drawers, slide-to-action controls for submissions.
- **Zero Heavy Component Libraries:** Pure Tailwind CSS with custom lightweight primitives in `frontend/src/components/ui/` (`Button`, `Modal`, `Drawer`, `Badge`, `Card`, `Tooltip`).

### 7.2 Core Views Hierarchy
```
App.tsx
 ├── AuthProvider (AuthContext)
 └── Layout (Sidebar + TopBar + Global Notifications Drawer)
      └── ErrorBoundary
           ├── DashboardView (KPI cards, utilization, activity stream)
           ├── TimesheetsView (Project cards, calendar matrix, slide submit)
           │    ├── ProjectTimesheetView
           │    ├── ProjectTimesheetGridRow
           │    ├── QuickTimeDrawer
           │    └── SlideToActionDrawer
           ├── EmployeesView (Employee table, search, detail & edit drawers)
           ├── ClientsView (Client directory, tax details, project drawers)
           ├── ProjectsView (Project catalog, budget & rate versioning drawers)
           ├── LeavesView (Balance overview, request tables, calendar matrix)
           │    ├── LeaveApplyDrawer
           │    ├── CompOffApplyDrawer
           │    ├── LeaveApprovalDrawer
           │    └── TeamAvailabilityView
           ├── ReportsView (Revenue summary, FY selector, utilization charts)
           └── GeneralSettingsView (Super Admin only)
                ├── StudioPreferencesForm
                ├── BusinessLineManager
                ├── LeaveSettingsView
                └── HolidayManager
```

---

## 8. Deployment, Infrastructure & Production Operations

### 8.1 Process Management (PM2)
The application runs as a managed service via PM2 in cluster mode (`ecosystem.config.js`).

```javascript
module.exports = {
  apps: [
    {
      name: 'orangyy-carpels-backend',
      script: './backend/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        DATABASE_URL: 'mysql://orangyy:secure_password@127.0.0.1:3306/orangyy_carpels'
      }
    }
  ]
};
```

### 8.2 Web Server (Nginx Reverse Proxy)
Nginx routes inbound traffic:
- `/api/*` $\rightarrow$ Reverse proxied to `http://127.0.0.1:5001`
- `/*` $\rightarrow$ Serves pre-compiled production Vite bundle from `frontend/dist/` with single-page fallback to `index.html`.

### 8.3 Database Maintenance & Environment Sync Scripts
The workspace provides automated database migration and synchronization scripts:
- `./sync-db-to-fortest.sh`: Backs up and syncs local MySQL state to staging/test instances.
- `./sync-db-from-fortest.sh`: Pulls staging database dumps into local MySQL development server.
- `./deploy-now.sh`: Builds frontend, compiles TypeScript backend, executes Prisma schema migrations, and reloads PM2 instances.

---

## 9. Verification & Architectural Integrity Check

- [x] **Service Layer Pattern:** 100% of business logic encapsulated within `backend/src/services/` (`TimesheetService`, `LeaveService`, `BillingService`, `EmployeeService`, `ClientService`, `ProjectService`, `AuthService`).
- [x] **Zero Logic in Schemas:** Fastify routes only declare input types and validation constraints.
- [x] **Unified MySQL 8.0 Standard:** All tables and relations verified in `schema.prisma`.
- [x] **Security:** HTTP-only cookies, salted password hashing, route level RBAC guards.
- [x] **Auditability:** Complete timestamp tracking on all timesheet entries, approvals, rate versions, and leave logs.

---
*End of Technical Specification — Orangyy Carpels Production Build V1*
