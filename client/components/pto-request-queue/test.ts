import { querySingle } from '../test-utils.js';

export function playground() {
    console.log('Starting PTO Request Queue playground test...');

    const ptoQueue = querySingle('pto-request-queue') as any;

    // Sample PTO requests data
    const sampleRequests = [
        {
            id: 1,
            employeeId: 1,
            employeeName: 'John Doe',
            startDate: '2024-02-15',
            endDate: '2024-02-16',
            type: 'PTO',
            hours: 16,
            status: 'pending',
            createdAt: '2024-02-01T10:00:00Z'
        },
        {
            id: 2,
            employeeId: 2,
            employeeName: 'Jane Smith',
            startDate: '2024-02-20',
            endDate: '2024-02-20',
            type: 'Sick',
            hours: 8,
            status: 'pending',
            createdAt: '2024-02-02T14:30:00Z'
        },
        {
            id: 3,
            employeeId: 3,
            employeeName: 'Bob Johnson',
            startDate: '2024-03-01',
            endDate: '2024-03-05',
            type: 'PTO',
            hours: 40,
            status: 'approved',
            createdAt: '2024-02-01T09:15:00Z'
        }
    ];

    // Set initial data
    ptoQueue.requests = sampleRequests;

    // Test event listeners
    ptoQueue.addEventListener('request-approve', (e: CustomEvent) => {
        console.log('Approve request:', e.detail.requestId);
        querySingle('#test-output').textContent = `Approved request ID: ${e.detail.requestId}`;
    });

    ptoQueue.addEventListener('request-reject', (e: CustomEvent) => {
        console.log('Reject request:', e.detail.requestId);
        querySingle('#test-output').textContent = `Rejected request ID: ${e.detail.requestId}`;
    });

    // Test data updates
    setTimeout(() => {
        console.log('Testing data update...');
        const updatedRequests = [...sampleRequests, {
            id: 4,
            employeeId: 1,
            employeeName: 'John Doe',
            startDate: '2024-02-25',
            endDate: '2024-02-26',
            type: 'Bereavement',
            hours: 16,
            status: 'pending',
            createdAt: '2024-02-03T11:45:00Z'
        }];
        ptoQueue.requests = updatedRequests;
        querySingle('#test-output').textContent = 'Added new PTO request for John Doe';
    }, 3000);

    console.log('PTO Request Queue playground test initialized');
}