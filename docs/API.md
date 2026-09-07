# Track My Money — REST API Specification

All endpoints require an authenticated user session cookie (`@supabase/ssr`). Requests and responses use `application/json`.

---

## Base URL
`/api`

---

## 1. Dashboard & Cash Flow

### `GET /api/dashboard`
Fetches the complete financial dashboard for a selected month.

**Query Parameters:**
- `month` (optional, string): Format `YYYY-MM`. Defaults to the current month.

**Response `200 OK`:**
```json
{
  "month": "2026-09",
  "cashIn": 245000,
  "cashOut": 89000,
  "netCashFlow": 156000,
  "expectedCashIn": 245000,
  "expectedCashOut": 89000,
  "expectedNetCashFlow": 156000,
  "retainedPercentage": 64,
  "recurringIncome": 150000,
  "variableIncome": 95000,
  "fixedCommitments": 89000,
  "coverageRatio": 1.69,
  "commitmentRatio": 59.3,
  "cashInBreakdown": [
    { "name": "Monthly Salary", "type": "SALARY", "amount": 150000, "isRecurring": true, "percentage": 61 },
    { "name": "Stock Market", "type": "STOCK_MARKET", "amount": 35000, "isRecurring": false, "percentage": 14 },
    { "name": "Business Revenue", "type": "BUSINESS", "amount": 50000, "isRecurring": false, "percentage": 20 },
    { "name": "Other Income", "type": "OTHER", "amount": 10000, "isRecurring": false, "percentage": 4 }
  ],
  "cashOutBreakdown": [
    { "name": "Home EMI", "category": "EMI", "amount": 35000, "percentage": 39 },
    { "name": "Credit Card", "category": "CREDIT_CARD", "amount": 25000, "percentage": 28 },
    { "name": "Car EMI", "category": "EMI", "amount": 18000, "percentage": 20 },
    { "name": "Health Insurance", "category": "INSURANCE", "amount": 8000, "percentage": 9 },
    { "name": "Streaming Subscriptions", "category": "SUBSCRIPTION", "amount": 3000, "percentage": 3 }
  ],
  "upcomingPayments": [
    { "id": "uuid", "name": "Home EMI", "category": "EMI", "dueDate": "2026-09-05", "amount": 35000, "status": "UPCOMING" }
  ],
  "history": [
    { "month": "2026-04", "monthLabel": "Apr", "cashIn": 210000, "cashOut": 85000, "net": 125000 },
    { "month": "2026-05", "monthLabel": "May", "cashIn": 220000, "cashOut": 87000, "net": 133000 },
    { "month": "2026-06", "monthLabel": "Jun", "cashIn": 230000, "cashOut": 88000, "net": 142000 },
    { "month": "2026-07", "monthLabel": "Jul", "cashIn": 225000, "cashOut": 89000, "net": 136000 },
    { "month": "2026-08", "monthLabel": "Aug", "cashIn": 240000, "cashOut": 89000, "net": 151000 },
    { "month": "2026-09", "monthLabel": "Sep", "cashIn": 245000, "cashOut": 89000, "net": 156000 }
  ]
}
```

---

### `GET /api/cash-flow`
Calculates high-level cash flow summary.

**Query Parameters:**
- `month` (optional, string): Format `YYYY-MM`.

---

### `GET /api/cash-flow/breakdown`
Returns detailed breakdowns for income streams and obligations with percentage contributions.

---

### `GET /api/cash-flow/history`
Returns aggregated monthly totals for trend analysis.

**Query Parameters:**
- `months` (optional, number): Number of months (1–12, default `6`).
- `month` (optional, string): Anchor month `YYYY-MM`.

---

## 2. Cash In (Income)

### `GET /api/income`
Lists all income sources and records for the selected month.

**Query Parameters:**
- `month` (optional, string): Format `YYYY-MM`.

---

### `POST /api/income`
Creates an income source stream or logs an income record.

**Request Body (Create Source):**
```json
{
  "action": "create_source",
  "name": "Salary",
  "income_type": "SALARY",
  "expected_amount": 150000,
  "is_recurring": true,
  "frequency": "MONTHLY",
  "description": "Primary tech salary"
}
```

**Request Body (Record Received/Expected Amount):**
```json
{
  "action": "create_record",
  "income_source_id": "uuid",
  "amount": 35000,
  "income_date": "2026-09-08",
  "status": "RECEIVED",
  "description": "Dividends & swing profits"
}
```

---

### `GET /api/income/:id`
Retrieves a specific income source or record.

### `PUT /api/income/:id`
Updates income source or record details.

### `DELETE /api/income/:id`
Deletes an income source or record.

---

## 3. Cash Out (Fixed Obligations)

### `GET /api/cash-out`
Lists all fixed financial commitments and monthly payments.

**Query Parameters:**
- `month` (optional, string): Format `YYYY-MM`.

---

### `POST /api/cash-out`
Creates a fixed commitment or records a payment.

**Request Body (Create Commitment):**
```json
{
  "name": "Home EMI",
  "current_amount": 35000,
  "category": "EMI",
  "due_day": 5,
  "frequency": "MONTHLY",
  "is_active": true,
  "provider": "HDFC Bank"
}
```

**Request Body (Record Payment):**
```json
{
  "action": "record_payment",
  "obligation_id": "uuid",
  "due_date": "2026-09-05",
  "amount_paid": 35000,
  "status": "PAID"
}
```

---

### `GET /api/cash-out/upcoming`
Returns upcoming fixed commitments within a given day window.

**Query Parameters:**
- `days` (optional, number): Number of days forward (default: `30`).

---

## 4. Transactions, Projections & Accounts

- `GET /api/transactions?limit=50&type=INCOME|EXPENSE|TRANSFER`
- `POST /api/transactions`
- `GET /api/projection?months=6`
- `GET /api/accounts`
- `POST /api/accounts`

---

## Error Handling

Standard HTTP status codes:
- `200` / `201`: Success
- `400`: Validation error (`{ "error": "Reason" }`)
- `401`: Unauthorized (`{ "error": "Unauthorized: Please log in." }`)
- `404`: Resource not found (`{ "error": "Resource not found" }`)
- `500`: Internal server error (`{ "error": "Detailed message" }`)
