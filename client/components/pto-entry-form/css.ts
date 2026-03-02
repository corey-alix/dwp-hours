export const styles = `
                :host {
                    display: block;
                }

                .hidden {
                    display: none;
                }

                .calendar-header-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-md);
                }

                .calendar-month-label {
                    font-weight: var(--font-weight-semibold);
                    text-transform: uppercase;
                    color: var(--color-text);
                }

                .calendar-view {
                    overflow: hidden;
                }

                .calendar-container {
                    /* Animation is driven by the shared animation library (animateCarousel) */
                }

                .nav-arrow {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: var(--font-size-xl);
                    color: var(--color-text);
                    padding: var(--space-xs);
                    border-radius: var(--border-radius-sm);
                    transition: background-color var(--duration-fast) var(--easing-standard);
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .nav-arrow:hover {
                    background: var(--color-surface-hover);
                }

                .nav-arrow:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .required {
                    color: var(--color-error);
                }

                /* Responsive design */
                @media screen {
                  .form-actions {
                    display: flex;
                  }
                }

                @media (max-width: 768px) {
                    .form-actions {
                        flex-wrap: wrap;
                        gap: var(--space-sm);
                    }

                    .btn {
                        flex: 1;
                        min-width: 120px;
                    }
                }

                /* ── Single-calendar mode (one month visible at a time) ── */

                :host([data-mode="single"]) .month-card {
                    display: none;
                }

                :host([data-mode="single"]) .month-card.active {
                    display: block;
                }

                /* ── Multi-calendar grid (all 12 months visible) ── */

                :host([data-mode="multi"]) {
                    max-width: none;
                }

                :host([data-mode="multi"]) .calendar-header-nav {
                    display: none;
                }

                :host([data-mode="multi"]) .balance-summary-section {
                    position: sticky;
                    top: 0;                    
                }

                :host([data-mode="multi"]) .calendar-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: var(--space-sm);
                }

                :host([data-mode="multi"]) .month-card {
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: var(--border-radius-md);
                    background: var(--color-surface);
                    overflow: hidden;
                    display: grid;
                    grid-template-rows: 1fr auto;
                }

                @media (min-width: 1200px) {
                    :host([data-mode="multi"]) .calendar-container {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }

                @media (min-width: 1600px) {
                    :host([data-mode="multi"]) .calendar-container {
                        grid-template-columns: repeat(6, 1fr);
                    }
                }

                :host([data-mode="multi"]) .month-card.locked {
                    opacity: 0.5;
                    pointer-events: none;
                }

                :host([data-mode="multi"]) .month-card.highlight {
                    animation: highlightPulse 1.2s ease-out;
                }

                @keyframes highlightPulse {
                    0% { box-shadow: 0 0 0 3px var(--color-primary); }
                    100% { box-shadow: none; }
                }

                @media (prefers-reduced-motion: reduce) {
                    :host([data-mode="multi"]) .month-card.highlight {
                        animation: none;
                    }
                }

                ::slotted(month-summary) {
                    margin-bottom: var(--space-lg);
                }
`;
