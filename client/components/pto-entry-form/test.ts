import { querySingle } from '../test-utils.js';

export function playground() {
    console.log('Starting PTO Entry Form playground test...');

    const ptoForm = querySingle('pto-entry-form') as any;

    // Test event listeners
    ptoForm.addEventListener('pto-submit', (e: CustomEvent) => {
        console.log('PTO form submitted:', e.detail);
        querySingle('#test-output').textContent = `PTO submitted: ${e.detail.ptoRequest.ptoType} - ${e.detail.ptoRequest.hours} hours`;
    });

    ptoForm.addEventListener('form-cancel', () => {
        console.log('PTO form cancelled');
        querySingle('#test-output').textContent = 'PTO form cancelled';
    });

    // Test form reset functionality
    setTimeout(() => {
        console.log('Testing form reset...');
        // Simulate filling the form
        const startDateInput = ptoForm.shadowRoot.getElementById('start-date') as HTMLInputElement;
        const endDateInput = ptoForm.shadowRoot.getElementById('end-date') as HTMLInputElement;
        const ptoTypeSelect = ptoForm.shadowRoot.getElementById('pto-type') as HTMLSelectElement;
        const hoursInput = ptoForm.shadowRoot.getElementById('hours') as HTMLInputElement;

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