# Frontend-to-backend table map

The Apps Script backend treats Google Sheets tabs as its operational tables. `setupSeedData` now replaces the demo workbook with a complete, deterministic June 2026 data pack (including 480 flight-operation rows, 360 check-ins, 300 exceptions, 120 attendance rows, 80 recovery cases, and supporting records for every operational module). It is intended for development and demo use only; production imports should use authenticated write actions and retain the audit trail.

## API read contract

| Action | Purpose |
| --- | --- |
| `crewList` | Crew directory used by the connected frontend shell. |
| `operationalList` with `sheet`, optional `startDate`, `endDate` | Read-only, allow-listed operational-table query for module integrations. |
| `sheetSummary` | Record counts/status for the backend monitor. |
| `schemaList` | Canonical headers for every backend table; used by the universal frontend writer. |
| `recordCreate` | Create a record in any allow-listed backend table using its canonical fields. |
| `recordGet` | Fetch one allow-listed record by a canonical key field; use after a write to verify the persisted value. |
| `recordUpdate` | Update a record in any allow-listed backend table by a selected key field/value. |

## Module mapping

| Frontend module | Primary tables | Supporting tables | Notes |
| --- | --- | --- | --- |
| Command Center / Flight Operations | `Flight_Operations` | `Operational_Exceptions`, `CheckIns`, `Roster_Changes` | Date-filter each table with `operationalList`. |
| Roster Editor | `Roster_Published` | `Crew_Master`, `Crew_Availability`, `Roster_Changes`, `Rule_Evaluations` | Published roster is the schedule source; changes preserve the before/after audit record. |
| Demand & Schedule Import | `Flight_Operations` | `Operational_Exceptions` | Flight status and aircraft-swap exceptions drive demand gaps. |
| Crew 360 | `Crew_Master` | `Crew_Qualifications`, `Crew_Medical`, `Crew_Availability` | Crew list is loaded by the shell after a healthy backend ping. |
| Ops Control / Check-in | `CheckIns` | `Attendance`, `Operational_Exceptions`, `Notifications` | The attendance form writes `Attendance` through `attendanceCreate`; check-ins remain their operational source. |
| Allowances | `Roster_Actual`, `Crew_Master`, `Allowance_Rates` | `Allowance_Runs`, `Allowance_Lines`, `Audit_Log` | Existing calculate/finalize actions remain the monetary source of truth. |
| HR Policies | `HR_Policies` | `Audit_Log` | Controlled policy records and approval dates. |
| Recovery | `Recovery_Cases` | `Operational_Exceptions`, `Roster_Published`, `Crew_Availability`, `Notifications` | One recovery case references the triggering exception. |
| Optimizer | `Optimizer_Scenarios` | `Roster_Published`, `Rules_Config`, `Rule_Evaluations` | Scenarios store outcome metrics; rules retain constraint evidence. |
| Rules Console | `Rules_Config` | `Rule_Evaluations`, `Roster_Changes` | Config defines constraints; evaluations record their results and overrides. |
| Reports & Analytics | `Flight_Operations` | `CheckIns`, `Attendance`, `Recovery_Cases`, `Allowance_Runs`, `Allowance_Lines` | Aggregate server-side for production reporting. |
| Backend / API Monitor | `Audit_Log` | all tables via `sheetSummary` | Use the summary action instead of hard-coded record counts. |
| Admin & RBAC | `User_RBAC` | `Crew_Master`, `Rules_Config`, `Audit_Log` | User privileges, crew profile, system controls, and change history. |
| Copilot | Read-only operational tables | `Crew_Master`, `HR_Policies`, `Rules_Config` | Restrict queries to authorized role scope. |

## Seed/reset behavior

* `setupSeedData` **replaces** the seeded tables with the complete demo data pack and logs the setup event.
* `setupOperationalSheets` is additive only: it creates missing table tabs and does not replace existing rows.
* Call `schemaList` after deployment to consume canonical column names rather than duplicating headers in a client.
