import { BaseComponent } from "../base-component.js";
import type {
  PtoBalanceData,
  PtoBalanceCategoryItem,
} from "../../../shared/api-models.js";

const STYLES = `
  :host {
    display: block;
  }

  .balance-row {
    display: flex;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .balance-badge {
    display: inline-flex;
    gap: var(--space-xs);
    align-items: center;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }

  .badge-label {
    font-weight: 500;
  }

  .badge-value {
    font-weight: 600;
  }

  .balance-available .badge-value {
    color: var(--color-success);
  }

  .balance-exceeded .badge-value {
    color: var(--color-error);
  }

  .empty {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }
`;

export class PtoBalanceSummary extends BaseComponent {
  private _data: PtoBalanceData | null = null;

  setBalanceData(data: PtoBalanceData): void {
    this._data = data;
    this.requestUpdate();
  }

  protected render(): string {
    if (!this._data) {
      return `<style>${STYLES}</style><div class="empty">No balance data</div>`;
    }
    if (this._data.categories.length === 0) {
      return `<style>${STYLES}</style><div class="empty">No categories</div>`;
    }
    return `
      <style>${STYLES}</style>
      <div class="balance-row" role="status" aria-label="PTO balance summary for ${this._data.employeeName}">
        ${this._data.categories.map((cat) => this.renderCategory(cat)).join("")}
      </div>
    `;
  }

  private renderCategory(cat: PtoBalanceCategoryItem): string {
    const statusClass =
      cat.remaining >= 0 ? "balance-available" : "balance-exceeded";
    const sign = cat.remaining < 0 ? "" : "";
    return `
      <span class="balance-badge ${statusClass}" aria-label="${cat.category}: ${sign}${cat.remaining} hours remaining">
        <span class="badge-label">${cat.category}</span>
        <span class="badge-value">${cat.remaining}h</span>
      </span>
    `;
  }
}

customElements.define("pto-balance-summary", PtoBalanceSummary);
