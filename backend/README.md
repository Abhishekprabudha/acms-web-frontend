# ACMS Allowance Apps Script Backend

This Google Apps Script web app persists crew, actual roster duties, rates, allowance runs, allowance lines, attendance, and an audit log in one Google Spreadsheet.

## Deploy

1. Create a Google Spreadsheet and a standalone Apps Script project.
2. Copy `Code.gs` and `appsscript.json` into the project.
3. In **Project Settings → Script properties**, set `ACMS_SPREADSHEET_ID` to the spreadsheet ID.
4. Deploy as a Web app and copy its `/exec` URL into `VITE_APPS_SCRIPT_URL` or the application's Admin API URL field.
5. POST `{ "action": "setupSeedData" }` once to create the sheets and June 2026 sample data.

## Supported actions

| Action | Required payload | Result |
| --- | --- | --- |
| `ping` | — | Backend health and supported actions. |
| `setupSeedData` | — | Creates/replaces the documented sample dataset. |
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
