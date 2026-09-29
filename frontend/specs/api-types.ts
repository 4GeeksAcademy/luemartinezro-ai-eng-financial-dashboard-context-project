/**
 * API response types for the Financial Dashboard.
 *
 * These interfaces model the JSON bodies returned by the FastAPI backend
 * (`backend/app/routes.py`). Each name and property was verified against the
 * generated OpenAPI schema (`/openapi.json`, served by FastAPI at `/docs`).
 *
 * Conventions:
 * - Strict TypeScript: no `any`, no `object`, no implicit casts.
 * - Property names mirror the backend exactly (snake_case).
 * - JSON `number` values are typed as `number`; JSON strings are typed as
 *   `string`. Dates arrive as ISO-8601 strings and stay `string` here.
 *
 * Relevant endpoints:
 * - `GET /api/metrics/facets`        → `FacetsResponse`
 * - `GET /api/metrics/alerts`        → `AlertResponse`
 * - `GET /api/metrics/categories/top`→ `TopCategoriesResponse`
 * - `GET /api/metrics/summary`       → `MetricsSummaryItem` (used by B2B vs B2C view)
 */

/**
 * Valid operation types, as declared by the backend `OperationType` literal.
 */
export type OperationType = 'income' | 'outcome'

/**
 * Valid categories, as declared by the backend `Category` literal.
 */
export type Category =
  | 'suppliers'
  | 'sales'
  | 'operational'
  | 'administrative'
  | 'others'

/**
 * Valid business lines, as declared by the backend `BusinessType` literal.
 */
export type BusinessType = 'B2B' | 'B2C'

/**
 * Response body of `GET /api/metrics/facets`.
 *
 * Used as reference for the available date range (Feature 1) and for the
 * categories/business-type filters of the B2B vs B2C comparison (Feature 3).
 */
export interface FacetsResponse {
  /** Operation types present in the dataset. Valid values: `"income"`, `"outcome"`. */
  operation_types: OperationType[]
  /** Business lines present in the dataset. Valid values: `"B2B"`, `"B2C"`. */
  business_types: BusinessType[]
  /** Categories present in the dataset. Valid values: `"suppliers"`, `"sales"`, `"operational"`, `"administrative"`, `"others"`. */
  categories: Category[]
  /** Earliest movement date in the dataset. Format: ISO-8601 `YYYY-MM-DD`. */
  min_date: string
  /** Latest movement date in the dataset. Format: ISO-8601 `YYYY-MM-DD`. */
  max_date: string
}

/**
 * A single anomaly entry returned by `GET /api/metrics/alerts`.
 */
export interface AlertEntry {
  /**
   * Period label of the anomalous bucket.
   * Depends on the `group_by` param: e.g. `"2024-01"` (month),
   * `"2024-W03"` (week), `"2024-01-15"` (day).
   */
  period: string
  /** Total outcome registered for that period. Non-negative monetary value in USD. */
  outcome_total: number
  /**
   * Average outcome of the reference periods used as baseline.
   * NOTE: the current backend computes the mean of ALL previous periods, not a
   * 3-period rolling window as requested in `prompst.md` (see spec 02).
   */
  baseline_average: number
  /** `(outcome_total - baseline_average) / baseline_average`. A ratio, can be any finite number. */
  increase_ratio: number
}

/**
 * Response body of `GET /api/metrics/alerts` — an array of {@link AlertEntry}.
 */
export type AlertResponse = AlertEntry[]

/**
 * A single category aggregate returned by `GET /api/metrics/categories/top`.
 */
export interface CategoryEntry {
  /** Category of the aggregated movements. See {@link Category}. */
  category: Category
  /**
   * Operation type used to aggregate the totals.
   * Valid values: `"income"`, `"outcome"`.
   */
  operation_type: OperationType
  /** Sum of `amount` for the matching movements (filtered by category + operation type). Non-negative USD amount. */
  total_amount: number
}

/**
 * Response body of `GET /api/metrics/categories/top` — an array of
 * {@link CategoryEntry}, sorted by `total_amount` descending and limited by
 * the `limit` query param.
 */
export type TopCategoriesResponse = CategoryEntry[]

/**
 * Response body of `GET /api/metrics/summary` — an aggregated bucket.
 * Used by the B2B vs B2C view to compare income between business lines.
 */
export interface MetricsSummaryItem {
  /** Period label of the bucket; format depends on `group_by` (e.g. `"2024-01"`). */
  period: string
  /** Sum of income amounts in the bucket. Non-negative USD amount. */
  income: number
  /** Sum of outcome amounts in the bucket. Non-negative USD amount. */
  outcome: number
  /** `income - outcome` for the bucket. Can be negative (net loss). USD amount. */
  net: number
}