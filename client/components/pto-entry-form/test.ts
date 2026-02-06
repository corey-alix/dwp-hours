import { querySingle } from '../test-utils.js';
import { addEventListener } from '../test-utils.js';
import { PtoEntryForm } from './index.js';

export function playground() {
    console.log('Starting PTO Entry Form playground test...');

    const ptoForm = querySingle<PtoEntryForm>('pto-entry-form');

    // Test event listeners
    addEventListener(ptoForm, 'pto-submit', (e: CustomEvent) => {
        console.log('PTO form submitted:', e.detail);
        querySingle('#test-output').textContent = `PTO submitted: ${e.detail.ptoRequest.ptoType} - ${e.detail.ptoRequest.hours} hours`;
    });

    addEventListener(ptoForm, 'form-cancel', () => {
        console.log('PTO form cancelled');
        querySingle('#test-output').textContent = 'PTO form cancelled';
    });

    // Test form reset functionality
    setTimeout(() => {
        console.log('Testing form reset...');
        // Simulate filling the form
        const startDateInput = querySingle<HTMLInputElement>('#start-date', ptoForm.shadowRoot!);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', ptoForm.shadowRoot!);
        const ptoTypeSelect = querySingle<HTMLSelectElement>('#pto-type', ptoForm.shadowRoot!);
        const hoursInput = querySingle<HTMLInputElement>('#hours', ptoForm.shadowRoot!);

        if (startDateInput && endDateInput && ptoTypeSelect && hoursInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date();
            dayAfter.setDate(dayAfter.getDate() + 2);

            startDateInput.value = tomorrow.toISOString().split('T')[0];
            endDateInput.value = dayAfter.toISOString().split('T')[0];
            ptoTypeSelect.value = 'Full PTO';
            hoursInput.value = '8';

            querySingle('#test-output').textContent = 'Form filled with test data';
        }
    }, 2000);

    // Test form reset
    setTimeout(() => {
        console.log('Testing form reset...');
        ptoForm.reset();
        querySingle('#test-output').textContent = 'Form reset';
    }, 5000);

    // Test focus functionality
    setTimeout(() => {
        console.log('Testing focus...');
        ptoForm.focus();
        querySingle('#test-output').textContent = 'Form focused';
    }, 7000);

    console.log('PTO Entry Form playground test initialized');
}