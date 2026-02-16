import { BaseComponent } from "../base-component.js";
import { CARD_CSS } from "../utils/pto-card-css.js";
import {
  renderCardShell,
  renderBucketBody,
  type UsageEntry,
} from "../utils/pto-card-helpers.js";
import { parseDate, isValidDateString } from "../../../shared/dateUtils.js";
import type { PTOEntry } from "../../../shared/api-models.js";

export class PtoPtoCard extends BaseComponent {
  private data: { allowed: number; used: number; remaining: number } | null =
    null;
  private entries: UsageEntry[] = [];
  private expanded: boolean = false;
  private fullEntries: PTOEntry[] = [];

  static get observedAttributes() {
    return ["data", "entries", "expanded", "full-entries"];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "data") {
      this.data = JSON.parse(newValue);
    } else if (name === "entries") {
      this.entries = JSON.parse(newValue);
    } else if (name === "expanded") {
      this.expanded = newValue === "true";
    } else if (name === "full-entries") {
      this.fullEntries = JSON.parse(newValue);
    }
    this.requestUpdate();
  }

  set bucket(value: any) {
    this.data = value;
    this.requestUpdate();
  }

  set usageEntries(value: UsageEntry[]) {
    this.entries = value;
    this.requestUpdate();
  }

  get usageEntries(): UsageEntry[] {
    return this.entries;
  }

  set isExpanded(value: boolean) {
    this.expanded = value;
    this.setAttribute("expanded", value.toString());
  }

  set fullPtoEntries(value: PTOEntry[]) {
    this.fullEntries = value;
    this.requestUpdate();
  }

  get fullPtoEntries(): PTOEntry[] {
    return this.fullEntries;
  }

  protected render(): string {
    if (!this.data) {
      return `<style>${CARD_CSS}</style>${renderCardShell("PTO", "<div>Loading...</div>")}`;
    }
    const body = renderBucketBody({
      data: this.data,
      entries: this.entries,
      expanded: this.expanded,
      entryType: "PTO",
      fullEntries: this.fullEntries,
      showNegativeFormatting: true,
    });
    return `<style>${CARD_CSS}</style>${renderCardShell("PTO", body)}`;
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.matches(".toggle-button") || target.closest(".toggle-button")) {
      this.expanded = !this.expanded;
      this.requestUpdate();
      return;
    }
    if (target.matches(".usage-date")) {
      const dateStr = (target as HTMLElement).dataset.date;
      if (dateStr && isValidDateString(dateStr)) {
        const { year, month } = parseDate(dateStr);
        this.dispatchEvent(
          new CustomEvent("navigate-to-month", {
            detail: { month, year },
            bubbles: true,
          }),
        );
      }
    }
  }

  protected handleDelegatedKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (target.matches(".usage-date") && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      const dateStr = target.dataset.date;
      if (dateStr && isValidDateString(dateStr)) {
        const { year, month } = parseDate(dateStr);
        this.dispatchEvent(
          new CustomEvent("navigate-to-month", {
            detail: { month, year },
            bubbles: true,
          }),
        );
      }
    }
  }
}

customElements.define("pto-pto-card", PtoPtoCard);
