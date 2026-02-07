import { PriorYearReview } from './index.js';

export function playground(): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
        <h2>Prior Year Review Component Test</h2>
        <p>This demonstrates the prior year review component.</p>
    `;

    // Create the component
    const review = document.createElement('prior-year-review') as PriorYearReview;

    container.appendChild(review);

    // Add some test controls
    const controls = document.createElement('div');
    controls.innerHTML = `
        <h3>Test Controls</h3>
        <button id="test-loading">Test Loading State</button>
        <button id="test-error">Test Error State</button>
        <div id="test-results"></div>
    `;
    container.appendChild(controls);

    // Add event listeners for testing
    const testLoadingBtn = container.querySelector('#test-loading') as HTMLButtonElement;
    const testErrorBtn = container.querySelector('#test-error') as HTMLButtonElement;
    const testResults = container.querySelector('#test-results') as HTMLDivElement;

    testLoadingBtn.addEventListener('click', () => {
        testResults.innerHTML = '<p>Testing loading state...</p>';
        // The component handles loading internally
    });

    testErrorBtn.addEventListener('click', () => {
        testResults.innerHTML = '<p>Testing error state...</p>';
        // The component handles errors internally
    });

    return container;
}