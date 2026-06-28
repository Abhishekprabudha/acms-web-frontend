export const mockData = {
  "kpis": [
    {
      "label": "Flights Today",
      "value": "138",
      "note": "92% crewed",
      "tone": "ok"
    },
    {
      "label": "Open Exceptions",
      "value": "17",
      "note": "6 high priority",
      "tone": "risk"
    },
    {
      "label": "Late Check-ins",
      "value": "4",
      "note": "auto-escalated",
      "tone": "warn"
    },
    {
      "label": "Roster Stability",
      "value": "87%",
      "note": "+4 pts vs last week",
      "tone": "info"
    }
  ],
  "crew": [
    {
      "crewId": "CPT-204",
      "name": "A. Rahman",
      "rank": "CPT",
      "base": "KUL",
      "fleet": "ATR",
      "status": "Ready",
      "medical": "Valid",
      "license": "Valid",
      "training": "SEP due 42d"
    },
    {
      "crewId": "FO-872",
      "name": "S. Tan",
      "rank": "FO",
      "base": "PEN",
      "fleet": "ATR",
      "status": "Training",
      "medical": "Valid",
      "license": "Valid",
      "training": "Line check"
    },
    {
      "crewId": "CC-519",
      "name": "N. Lim",
      "rank": "CC",
      "base": "KUL",
      "fleet": "ATR",
      "status": "Ready",
      "medical": "Valid",
      "license": "N/A",
      "training": "CRM valid"
    },
    {
      "crewId": "CPT-355",
      "name": "R. Kumar",
      "rank": "CPT",
      "base": "BKI",
      "fleet": "B737",
      "status": "Med expiring",
      "medical": "Expiring",
      "license": "Valid",
      "training": "Valid"
    },
    {
      "crewId": "FO-111",
      "name": "M. Lee",
      "rank": "FO",
      "base": "KUL",
      "fleet": "ATR",
      "status": "Ready",
      "medical": "Valid",
      "license": "Valid",
      "training": "Valid"
    }
  ],
  "flights": [
    {
      "flight": "FY3124",
      "sector": "KUL-PEN",
      "std": "08:10",
      "sta": "09:10",
      "aircraft": "ATR72",
      "need": "CPT/FO/2CC",
      "status": "Crewed"
    },
    {
      "flight": "FY2176",
      "sector": "PEN-JHB",
      "std": "10:30",
      "sta": "11:45",
      "aircraft": "ATR72",
      "need": "CPT/FO/2CC",
      "status": "Missing CC"
    },
    {
      "flight": "FY4020",
      "sector": "SZB-BKI",
      "std": "12:40",
      "sta": "15:15",
      "aircraft": "B737",
      "need": "CPT/FO/4CC",
      "status": "Delay risk"
    },
    {
      "flight": "FY1108",
      "sector": "KUL-LGK",
      "std": "16:05",
      "sta": "17:00",
      "aircraft": "ATR72",
      "need": "CPT/FO/2CC",
      "status": "Crewed"
    }
  ],
  "exceptions": [
    {
      "type": "No-show",
      "crew": "CPT-204",
      "sla": "12m",
      "priority": "High"
    },
    {
      "type": "Rest risk",
      "crew": "FO-872",
      "sla": "28m",
      "priority": "High"
    },
    {
      "type": "Missing CC",
      "crew": "CC-519",
      "sla": "43m",
      "priority": "Med"
    },
    {
      "type": "License expiry",
      "crew": "FO-355",
      "sla": "2h",
      "priority": "Med"
    }
  ],
  "recoveryCases": [
    {
      "caseId": "RC-204",
      "issue": "No-show CPT",
      "flight": "FY3124",
      "priority": "High",
      "status": "Open"
    },
    {
      "caseId": "RC-205",
      "issue": "Delay duty risk",
      "flight": "FY4020",
      "priority": "High",
      "status": "Open"
    },
    {
      "caseId": "RC-206",
      "issue": "Aircraft swap",
      "flight": "FY2176",
      "priority": "Med",
      "status": "Ranked"
    },
    {
      "caseId": "RC-207",
      "issue": "CC shortage",
      "flight": "FY1108",
      "priority": "Med",
      "status": "Open"
    }
  ],
  "rules": [
    {
      "rule": "Min Rest",
      "result": "Fail",
      "action": "Replace crew",
      "severity": "Hard"
    },
    {
      "rule": "Max FDP",
      "result": "Pass",
      "action": "No action",
      "severity": "Hard"
    },
    {
      "rule": "Medical Validity",
      "result": "Fail",
      "action": "Block",
      "severity": "Hard"
    },
    {
      "rule": "Route Qualification",
      "result": "Warn",
      "action": "Supervisor approval",
      "severity": "Soft"
    },
    {
      "rule": "Consecutive Days",
      "result": "Pass",
      "action": "No action",
      "severity": "Hard"
    }
  ]
};
