export const styles = `
                :host {
                    display: block;
                    background: var(--color-surface);
                    border-radius: var(--border-radius-lg);
                    box-shadow: var(--shadow-md);
                    max-width: clamp(480px, 100cqw, 60vh);
                    margin: 0 auto;
                }

                .form-container {
                    padding: var(--space-sm);
                }

                .form-header {
                    margin-bottom: var(--space-lg);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .hidden {
                    display: none;
                }

                .calendar-view {
                    overflow: hidden;
                }

                .calendar-container {
                    /* Animation is driven by inline styles in navigateMonthWithAnimation() */
                }

                .calendar-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: var(--space-md);
                }

                .calendar-title {
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text);
                }

                .calendar-navigation {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                }

                .nav-arrow {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: var(--font-size-xl);
                    color: var(--color-text);
                    padding: var(--space-xs);
                    border-radius: var(--border-radius-sm);
                    transition: background-color 0.2s ease;
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

                /* Hide navigation arrows on touch devices */
                @media (hover: none) and (pointer: coarse) {
                    .form-header, .calendar-navigation, .nav-arrow {
                        display: none;
                    }
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

                /* ── Multi-calendar grid (all 12 months visible) ── */

                :host(.multi-calendar) {
                    max-width: none;
                }

                :host(.multi-calendar) .form-header {
                    display: none;
                }

                :host(.multi-calendar) .balance-summary-section {
                    position: sticky;
                    top: 0;                    
                }

                :host(.multi-calendar) .calendar-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: var(--space-sm);
                }

                :host(.multi-calendar) .month-card {
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: var(--border-radius-md);
                    background: var(--color-surface);
                    overflow: hidden;
                    display: grid;
                    grid-template-rows: 1fr auto;
                }

                @media (min-width: 1200px) {
                    :host(.multi-calendar) .calendar-container {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }

                @media (min-width: 1600px) {
                    :host(.multi-calendar) .calendar-container {
                        grid-template-columns: repeat(6, 1fr);
                    }
                }

                :host(.multi-calendar) .month-card.highlight {
                    animation: highlightPulse 1.2s ease-out;
                }

                @keyframes highlightPulse {
                    0% { box-shadow: 0 0 0 3px var(--color-primary); }
                    100% { box-shadow: none; }
                }

                @media (prefers-reduced-motion: reduce) {
                    :host(.multi-calendar) .month-card.highlight {
                        animation: none;
                    }
                }
`;
