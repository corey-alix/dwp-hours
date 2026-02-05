import { querySingle } from '../test-utils.js';

export function playground() {
    console.log('Starting Data Table playground test...');

    const dataTable = querySingle('data-table') as any;

    // Sample table data
    const sampleData = [
        { id: 1, name: 'John Doe', department: 'Engineering', hireDate: '2020-01-15' },
        { id: 2, name: 'Jane Smith', department: 'Marketing', hireDate: '2019-03-22' },
        { id: 3, name: 'Bob Johnson', department: 'Engineering', hireDate: '2018-11-08' },
        { id: 4, name: 'Alice Wilson', department: 'HR', hireDate: '2021-07-12' },
        { id: 5, name: 'Charlie Brown', department: 'Sales', hireDate: '2022-02-28' },
        { id: 6, name: 'Diana Prince', department: 'Engineering', hireDate: '2017-09-15' },
        { id: 7, name: 'Edward Norton', department: 'Marketing', hireDate: '2020-05-03' },
        { id: 8, name: 'Fiona Green', department: 'HR', hireDate: '2021-11-20' }
    ];

    // Table columns configuration
    const columns = [
        { key: 'id', label: 'ID', width: '60px' },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'department', label: 'Department', sortable: true },
        { key: 'hireDate', label: 'Hire Date', sortable: true }
    ];

    // Set initial data and columns
    dataTable.data = sampleData;
    dataTable.columns = columns;
    dataTable.pageSize = 5;

    // Test event listeners
    dataTable.addEventListener('sort-change', (e: CustomEvent) => {
        console.log('Sort changed:', e.detail);
        querySingle('#test-output').textContent = `Sorted by ${e.detail.sortKey} (${e.detail.sortDirection})`;
    });

    dataTable.addEventListener('page-change', (e: CustomEvent) => {
        console.log('Page changed:', e.detail);
        querySingle('#test-output').textContent = `Page changed to ${e.detail.page}`;
    });

    dataTable.addEventListener('page-size-change', (e: CustomEvent) => {
        console.log('Page size changed:', e.detail);
        querySingle('#test-output').textContent = `Page size changed to ${e.detail.pageSize}`;
    });

    // Test data updates
    setTimeout(() => {
        console.log('Testing data update...');
        const updatedData = [...sampleData, {
            id: 9,
            name: 'George Lucas',
            department: 'Engineering',
            hireDate: '2016-12-01'
        }];
        dataTable.data = updatedData;
        querySingle('#test-output').textContent = 'Added new employee: George Lucas';
    }, 3000);

    console.log('Data Table playground test initialized');
}