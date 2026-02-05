import { PtoCalendar, CalendarEntry } from './index.js';

export function playground(): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
        <h2>PTO Calendar Component Test</h2>
        <p>This demonstrates the extracted calendar component that can be tested independently.</p>
    `;

    // Create calendar component
    const calendar = document.createElement('pto-calendar') as PtoCalendar;

    // Sample data for February 2024
    const sampleEntries: CalendarEntry[] = [
        { date: '2024-02-12', hours: 4.0, type: 'Sick' },
        { date: '2024-02-14', hours: 8.0, type: 'Sick' },
        { date: '2024-02-16', hours: 8.0, type: 'Sick' },
        { date: '2024-02-20', hours: 8.0, type: 'PTO' },
        { date: '2024-02-21', hours: 8.0, type: 'PTO' },
        { date: '2024-02-22', hours: 4.0, type: 'PTO' }
    ];

    calendar.setMonth(1); // February (0-indexed)
    calendar.setYear(2024);
    calendar.setEntries(sampleEntries);
    // Keep readonly by default for testing

    // Add event listener for PTO request submission
    calendar.addEventListener('pto-request-submit', (event: any) => {
        console.log('PTO Request Submitted:', event.detail);
    });

    container.appendChild(calendar);

    // Add some test controls
    const controls = document.createElement('div');
    controls.innerHTML = `
        <h3>Test Controls</h3>
        <button id="test-colors">Test Color Coding</button>
        <button id="test-legend">Test Legend</button>
        <div id="test-results"></div>
    `;
    container.appendChild(controls);

    // Add event listeners for testing
    const testColorsBtn = container.querySelector('#test-colors') as HTMLButtonElement;
    const testLegendBtn = container.querySelector('#test-legend') as HTMLButtonElement;
    const testResults = container.querySelector('#test-results') as HTMLDivElement;

    testColorsBtn.addEventListener('click', () => {
        const sickDays = calendar.shadowRoot?.querySelectorAll('.type-Sick');
        const ptoDays = calendar.shadowRoot?.querySelectorAll('.type-PTO');
        testResults.innerHTML = `
            <p>Sick days found: ${sickDays?.length || 0}</p>
            <p>PTO days found: ${ptoDays?.length || 0}</p>
        `;
    });

    testLegendBtn.addEventListener('click', () => {
        const legendItems = calendar.shadowRoot?.querySelectorAll('.legend-item');
        testResults.innerHTML = `
            <p>Legend items: ${legendItems?.length || 0}</p>
        `;
    });

    return container;
}