import { querySingle } from '../test-utils.js';
import { addEventListener } from '../test-utils.js';
import { EmployeeForm } from './index.js';

export function playground() {
    console.log('Starting Employee Form playground test...');

    const employeeForm = querySingle('employee-form') as EmployeeForm;

    // Test event listeners
    addEventListener(employeeForm, 'employee-submit', (e: CustomEvent) => {
        console.log('Employee form submitted:', e.detail);
        querySingle('#test-output').textContent = `Form submitted: ${e.detail.isEdit ? 'Edit' : 'Add'} - ${e.detail.employee.name}`;
    });

    employeeForm.addEventListener('form-cancel', () => {
        console.log('Form cancelled');
        querySingle('#test-output').textContent = 'Form cancelled';
    });

    // Test edit mode
    setTimeout(() => {
        console.log('Testing edit mode...');
        const editEmployee = {
            id: 1,
            name: 'John Doe',
            identifier: 'JD001',
            ptoRate: 0.71,
            carryoverHours: 40,
            role: 'Admin',
            hash: 'hash1'
        };
        employeeForm.employee = editEmployee;
        employeeForm.isEdit = true;
        querySingle('#test-output').textContent = 'Switched to edit mode for John Doe';
    }, 3000);

    // Test add mode
    setTimeout(() => {
        console.log('Testing add mode...');
        employeeForm.employee = null;
        employeeForm.isEdit = false;
        querySingle('#test-output').textContent = 'Switched to add mode';
    }, 6000);

    console.log('Employee Form playground test initialized');
}