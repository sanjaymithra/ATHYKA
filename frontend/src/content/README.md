# ATHYKA Content Contract & Admin Guide

This document defines the schema, formatting rules, and validation contracts for all content managed in ATHYKA. Swapping the static JSON snapshots for a CMS or admin API (`VITE_CONTENT_API`) requires adhering to this contract.

---

## 1. Text Formatting & Emphasis Rules

All component text is data-driven. **Never use HTML tags in content fields.** The front-end renders all text safely using a strict parser:

- **Gold Accent Word**: Enclose words in single asterisks `*like this*`.
  - Example: `"What is your software\nactually *solving*?"`
  - Rendered: The marked word renders in true-italic gold (`#D8C48A`) with an organic SVG animated underline.
- **Headlines & Line Breaks**: Use `\n` to indicate explicit line breaks in headings and titles.
- **Microcopy**: Plain text only. Banned marketing buzzwords: *"unlock", "elevate", "seamless", "cutting-edge", "empower", "revolutionize", "next-level"*.

---

## 2. Record Standards & Lifecycle

Every collection item adheres to the base record schema:

```typescript
interface BaseRecord {
  id: string;                    // Unique slug or uuid (e.g. "srv-01", "prob-02")
  status: "draft" | "published"; // Publication status
  order: number;                 // Sort position (1-based integer)
  updatedAt: string;             // ISO 8601 date string
}
```

### Publication Rules:
- **`published`**: Rendered in all environments (development & production).
- **`draft`**:
  - In **Development** (`!import.meta.env.PROD`): Renders with a distinct dashed gold border and a `TODO: DRAFT` badge.
  - In **Production** (`import.meta.env.PROD`): Completely stripped from the DOM. If all items in a section are drafts, the section collapses into a minimal high-converting Booking CTA band.

---

## 3. Collections

### A. `services` (Digital Services)
- `id`: Unique identifier (e.g. `"srv-01"`).
- `status`: `"published"` | `"draft"`.
- `order`: Numeric sort index (determines dynamic `"01 /"`, `"02 /"` display).
- `kicker`: Short 1-word discipline label in uppercase (e.g. `"BUILD"`, `"DESIGN"`, `"AUTOMATE"`).
- `title`: Service title (e.g. `"Web development"`).
- `challenge`: 1-line provocative question (e.g. `"Is your website working as hard as you are?"`).
- `body`: Paragraph explaining the technical approach.
- `solves`: Array of 3 string items describing specific client pain points solved.
- `discussLabel`: CTA button label (default: `"Discuss this ↗"`).

### B. `problems` (Digital Services & Workshops)
- `id`: Identifier (e.g. `"prob-01"`).
- `status`: `"published"` | `"draft"`.
- `order`: Number.
- `provocation`: The visitor's current symptom / pain point.
- `solution`: ATHYKA's concrete answer / approach.
- `targetServiceId`: Optional service slug to link to.

### C. `process` (Digital Services)
- `id`: Identifier (e.g. `"step-01"`).
- `status`: `"published"` | `"draft"`.
- `order`: Step order number.
- `title`: Step title (e.g. `"Understand the problem"`).
- `body`: Step explanation.

### D. `projects` (Digital Services Work)
- `id`: Identifier.
- `status`: `"published"` | `"draft"`.
- `order`: Number.
- `name`: Client or project title.
- `challenge`: The operational problem faced.
- `whatWeBuilt`: The software, automation or architecture engineered.
- `result`: Concrete business or metric outcome.
- `link`: Optional project URL.
- `image`: Image object `{ url, alt, width, height }`.

### E. `formats` (Workshops)
- `id`: Identifier (e.g. `"fmt-01"`).
- `status`: `"published"` | `"draft"`.
- `order`: Number.
- `name`: Format name (e.g. `"Build day"`).
- `duration`: Time commitment (e.g. `"Full day (8h)"`).
- `whoItsFor`: Target student cohort.
- `leavesWith`: Deliverables produced by students during the session.

### F. `pastWorkshops` (Workshops Work)
- `id`: Identifier.
- `status`: `"published"` | `"draft"`.
- `order`: Number.
- `institution`: School or college name.
- `city`: Location.
- `date`: Month / term / year.
- `topic`: Subject covered.
- `attendees`: Cohort count (e.g. `"140 students"`).
- `photo`: Image object `{ url, alt, width, height }`.
- `quote`: Student or faculty testimonial.

### G. `team` (Workshops About)
- `id`: Identifier.
- `status`: `"published"` | `"draft"`.
- `order`: Number.
- `name`: Team member name.
- `role`: Role title (e.g. `"Founding Engineer"`).
- `flexLine`: One concrete technical credential (a shipped system, hackathon win, or scaled infrastructure).
- `photo`: Image object `{ url, alt, width, height }`.
- `links`: Array of `{ label, url }`.

### H. `quotes` (Philosophy Stage)
- **Strict Validation Rules**:
  - Exactly 2 lines in `lines: [string, string]`.
  - Each line must be $\le 20$ characters (excluding asterisks).
  - At most one `*accent*` word across the entire quote.
  - Any quote violating these rules is automatically discarded at runtime, retaining the previous valid quote to prevent stage layout shift.

---

## 4. Image Objects

All images must be specified as structured objects:

```json
{
  "url": "https://example.com/asset.jpg",
  "alt": "Descriptive text for accessibility",
  "width": 640,
  "height": 400
}
```

Components use `loading="lazy"` and render an accessible monogram or procedural dither placeholder when `url` is empty.

---

## 5. Site Settings Singleton (`siteSettings.json`)

Admin-configurable global settings:
- `bookingUrl`: External booking calendar link (e.g. Cal.com / SavvyCal).
- `contactEmail`: Primary contact email for `mailto:` fallback (`contact@athyka.com`).
- `leadEndpoint`: Remote API endpoint to receive structured lead POSTs.
- `social`: Key-value map of profile URLs.
- `defaultCtaLabels`: Global button text constants.
- `perPageMeta`: SEO title and description per route.

---

## 6. Lead Ingestion Schema

Submissions from the Booking Dialog dispatch this JSON payload to `leadEndpoint`:

```json
{
  "id": "lead_1727776800000_abc123",
  "type": "call" | "workshop",
  "fields": {
    "name": "Jane Doe",
    "email": "jane@company.com",
    "problem": "Manual data copying...",
    "service": "ERP systems",
    "company": "Acme Inc."
  },
  "utm": {
    "source": "twitter",
    "medium": "social",
    "campaign": "launch",
    "term": "",
    "content": ""
  },
  "page": "/digital-services",
  "createdAt": "2026-10-01T12:00:00.000Z"
}
```

If the endpoint is unreachable or offline, the lead is stored locally in `localStorage['athyka.leads.pending']` and retried automatically when the site is next opened.
