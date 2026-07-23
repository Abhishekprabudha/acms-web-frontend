# ACMS Allowance Apps Script Backend

This Google Apps Script web app persists crew, actual roster duties, rates, allowance runs, allowance lines, attendance, and an audit log in one Google Spreadsheet. It can also create empty operational sheet schemas for the broader ACMS frontend.

## Deploy

1. Create a Google Spreadsheet and a standalone Apps Script project.
2. Copy `Code.gs` and `appsscript.json` into the project.
3. In **Project Settings → Script properties**, set `ACMS_SPREADSHEET_ID` to the spreadsheet ID.
4. Deploy as a Web app and copy its `/exec` URL into `VITE_APPS_SCRIPT_URL` or the application's Admin API URL field.
5. POST `{ "action": "setupSeedData" }` once to create the sheets and June 2026 sample data. This also replaces every seeded operational table with a complete June 2026 demo dataset.

To add only the operational sheet tabs without replacing the allowance sample data, POST `{ "action": "setupOperationalSheets" }`. This action is additive: it never clears an existing sheet.

## Supported actions

| Action | Required payload | Result |
| --- | --- | --- |
| `ping` | — | Backend health and supported actions. |
| `setupSeedData` | — | Creates/replaces the documented sample dataset. |
| `setupOperationalSheets` | — | Creates the empty operational sheet tabs and header rows without changing existing data. |
| `schemaList` | — | Returns the operational sheet names and header labels. |
| `sheetSummary` | — | Returns record counts/status for all backend tables. |
| `operationalList` | `sheet`, optional `startDate`, `endDate` | Read-only rows from an allow-listed operational table. |
| `crewList` | — | Active crew master records. |
| `attendanceCreate` | `attendance.crewId`, `date`, `flight`, `reportTime`, `status` | Persists attendance and audit entry. |
| `allowanceCalculate` | `month` (`YYYY-MM`) | Creates or returns the month’s draft run and calculated crew lines. |
| `allowanceGetRun` | `runId` | Returns a run with its detail lines. |
| `allowanceListRuns` | — | Returns all allowance runs. |
| `allowanceFinalize` | `runId` | Marks a draft run finalized and audits the action. |

## Calculation rules

* Cabin crew: productivity allowance and productivity incentive are calculated from productive roster hours plus layover credit.
* Cabin layovers of 2:00–2:59 receive one credit hour; layovers of 3:00–11:00 receive three credit hours. Other durations receive no credit.
* Flight crew: flight-hour allowance is calculated from productive roster hours.
* All crew: one meal allowance per meal-eligible actual-roster duty.
* Payment rates are seeded as sample, effective-dated rows in `Allowance_Rates`; authorized users can change them without modifying the calculation engine.

All amounts are returned in the rate table's configured currency. Review and approve rates before payroll use.

## Frontend module map

See [`../BACKEND_TABLE_MAPPING.md`](../BACKEND_TABLE_MAPPING.md) for the frontend-module-to-table mapping, query actions, and seed volumes.

## Operational sheet schemas

`setupOperationalSheets` creates these empty tabs for future live integrations: `Roster_Published`, `Flight_Operations`, `CheckIns`, `Operational_Exceptions`, `Recovery_Cases`, `Crew_Qualifications`, `Crew_Medical`, `Crew_Availability`, `Rules_Config`, `Rule_Evaluations`, `HR_Policies`, `User_RBAC`, `Roster_Changes`, `Optimizer_Scenarios`, and `Notifications`.

The first row is the canonical column-label row. Use `schemaList` to retrieve the exact labels programmatically. The frontend automatically loads `Crew_Master` after a successful health check; the remaining module integrations can read their seeded table values through `operationalList` using the mapping document.
