export const dayNoteDialogStyles = `
:host {
    display: block;
}

.overlay {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 40%);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fade-in var(--duration-fast, 150ms) var(--easing-standard, ease);
}

.dialog {
    background: var(--color-surface, #f5f5f5);
    border: var(--border-width, 1px) var(--border-style-solid, solid) var(--color-border, #d1d5db);
    border-radius: var(--border-radius-lg, 8px);
    box-shadow: var(--shadow-lg, 0 2px 10px rgb(0 0 0 / 10%));
    padding: var(--space-lg, 24px);
    min-width: 280px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    animation: dialog-pop var(--duration-normal, 250ms) var(--easing-decelerate, ease-out);
}

@keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
}

@keyframes dialog-pop {
    from { transform: scale(0.95); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
}

.dialog-header {
    font-size: var(--font-size-lg, 1.125rem);
    font-weight: var(--font-weight-semibold, 600);
    color: var(--color-text, #1f2937);
    margin-bottom: var(--space-md, 16px);
}

.field {
    margin-bottom: var(--space-md, 16px);
}

.field label {
    display: block;
    font-size: var(--font-size-sm, 0.875rem);
    font-weight: var(--font-weight-medium, 500);
    color: var(--color-text-secondary, #4b5563);
    margin-bottom: var(--space-xs, 4px);
}

.field textarea {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-sm, 8px);
    border: var(--border-width, 1px) var(--border-style-solid, solid) var(--color-border, #d1d5db);
    border-radius: var(--border-radius, 4px);
    font-family: var(--font-family-base, sans-serif);
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--color-text, #1f2937);
    background: var(--color-background, #fafafa);
    resize: vertical;
    line-height: var(--line-height-base, 1.6);
}

.field textarea:focus {
    outline: none;
    border-color: var(--color-primary, #2563eb);
    box-shadow: 0 0 0 2px var(--color-primary-light, #eff6ff);
}

.field input[type="number"] {
    width: 80px;
    padding: var(--space-sm, 8px);
    border: var(--border-width, 1px) var(--border-style-solid, solid) var(--color-border, #d1d5db);
    border-radius: var(--border-radius, 4px);
    font-family: var(--font-family-base, sans-serif);
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--color-text, #1f2937);
    background: var(--color-background, #fafafa);
}

.field input[type="number"]:focus {
    outline: none;
    border-color: var(--color-primary, #2563eb);
    box-shadow: 0 0 0 2px var(--color-primary-light, #eff6ff);
}

.validation-error {
    color: var(--color-error, #dc2626);
    font-size: var(--font-size-xs, 0.75rem);
    margin-top: var(--space-xs, 4px);
    min-height: 1em;
}

.actions {
    display: flex;
    gap: var(--space-sm, 8px);
    justify-content: flex-end;
    margin-top: var(--space-lg, 24px);
}

.actions button {
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border-radius: var(--border-radius, 4px);
    font-size: var(--font-size-sm, 0.875rem);
    font-weight: var(--font-weight-medium, 500);
    cursor: pointer;
    border: var(--border-width, 1px) var(--border-style-solid, solid) transparent;
}

.btn-cancel {
    background: var(--color-surface, #f5f5f5);
    color: var(--color-text-secondary, #4b5563);
    border-color: var(--color-border, #d1d5db);
}

.btn-cancel:hover {
    background: var(--color-surface-hover, #e5e7eb);
}

.btn-save {
    background: var(--color-primary, #2563eb);
    color: var(--color-on-primary, white);
}

.btn-save:hover {
    background: var(--color-primary-hover, #1d4ed8);
}

.btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
    .overlay {
        animation: none;
    }

    .dialog {
        animation: none;
    }
}
`;
