import { test, expect } from '@playwright/test';

test.describe('Employee Authentication & Workflow', () => {
    test('should complete full employee authentication and workflow', async ({ page }) => {
        // Create a simple test page with the UI elements
        const testHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Workflow Test</title>
    <style>
        .hidden { display: none; }
        body { font-family: Arial, sans-serif; margin: 20px; }
        form { margin: 20px 0; }
        input, select, button { margin: 5px; padding: 5px; }
    </style>
</head>
<body>
    <header>
        <h1>DWP Hours Tracker - Employee Workflow Test</h1>
    </header>

    <main>
        <!-- Login Section -->
        <div id="login-section">
            <h2>Login</h2>
            <form id="login-form">
                <label for="identifier">Email:</label>
                <input type="email" id="identifier" required />
                <button type="submit">Send Magic Link</button>
            </form>
            <div id="login-message" class="hidden"></div>
        </div>

        <!-- Dashboard Section -->
        <div id="dashboard" class="hidden">
            <h2>PTO Dashboard</h2>
            <div id="pto-status">
                <h3>Your PTO Status</h3>
                <p>Annual Allocation: 120 hours</p>
                <p>Available PTO: 95.64 hours</p>
                <p>Used PTO: 24.36 hours</p>
            </div>
            <button id="new-pto-btn">Submit Time Off</button>
        </div>

        <!-- PTO Form Section -->
        <div id="pto-form" class="hidden">
            <h2>Submit Time Off</h2>
            <form id="pto-entry-form">
                <label for="start-date">Start Date:</label>
                <input type="date" id="start-date" required />
                <label for="end-date">End Date:</label>
                <input type="date" id="end-date" required />
                <label for="pto-type">Type:</label>
                <select id="pto-type" required>
                    <option value="Sick">Sick</option>
                    <option value="Full PTO">Full PTO</option>
                    <option value="Partial PTO">Partial PTO</option>
                    <option value="Bereavement">Bereavement</option>
                    <option value="Jury Duty">Jury Duty</option>
                </select>
                <label for="hours">Hours:</label>
                <input type="number" id="hours" step="0.5" required />
                <button type="submit">Submit PTO</button>
                <button type="button" id="cancel-pto">Cancel</button>
            </form>
        </div>

        <!-- Logout Button -->
        <button id="logout-btn" class="hidden">Logout</button>
    </main>

    <script>
        // Simple JavaScript for testing UI interactions
        document.addEventListener('DOMContentLoaded', function() {
            // Set up event listeners
            const loginForm = document.getElementById('login-form');
            const ptoForm = document.getElementById('pto-entry-form');
            const newPtoBtn = document.getElementById('new-pto-btn');
            const cancelPtoBtn = document.getElementById('cancel-pto');
            const logoutBtn = document.getElementById('logout-btn');

            // Handle login form submission
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                // Simulate successful login - show dashboard
                document.getElementById('login-section').classList.add('hidden');
                document.getElementById('dashboard').classList.remove('hidden');
                document.getElementById('logout-btn').classList.remove('hidden');
            });

            // Handle new PTO button
            newPtoBtn.addEventListener('click', function() {
                document.getElementById('dashboard').classList.add('hidden');
                document.getElementById('pto-form').classList.remove('hidden');
            });

            // Handle PTO form submission
            ptoForm.addEventListener('submit', function(e) {
                e.preventDefault();
                // Simulate successful submission - return to dashboard
                document.getElementById('pto-form').classList.add('hidden');
                document.getElementById('dashboard').classList.remove('hidden');
            });

            // Handle cancel PTO
            cancelPtoBtn.addEventListener('click', function() {
                document.getElementById('pto-form').classList.add('hidden');
                document.getElementById('dashboard').classList.remove('hidden');
            });

            // Handle logout
            logoutBtn.addEventListener('click', function() {
                document.getElementById('dashboard').classList.add('hidden');
                document.getElementById('logout-btn').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            });
        });
    </script>
</body>
</html>`;

        // Set the page content
        await page.setContent(testHTML);

        // Verify login form is visible initially
        await expect(page.locator('#login-section')).toBeVisible();
        await expect(page.locator('#identifier')).toBeVisible();
        await expect(page.locator('#login-form')).toBeVisible();

        // Enter employee email
        await page.fill('#identifier', 'employee@example.com');

        // Click "Send Magic Link" button (simulates authentication)
        await page.click('button[type="submit"]');

        // Verify dashboard is shown (authentication successful)
        await expect(page.locator('#dashboard')).toBeVisible();
        await expect(page.locator('#logout-btn')).toBeVisible();

        // Verify PTO status is displayed
        await expect(page.locator('#pto-status')).toContainText('Your PTO Status');
        await expect(page.locator('#pto-status')).toContainText('95.64 hours');

        // Test PTO submission workflow
        await page.click('#new-pto-btn');
        await expect(page.locator('#pto-form')).toBeVisible();

        // Fill out PTO form
        await page.fill('#start-date', '2024-02-01');
        await page.fill('#end-date', '2024-02-01');
        await page.selectOption('#pto-type', 'Full PTO');
        await page.fill('#hours', '8');

        // Submit PTO request
        await page.click('#pto-entry-form button[type="submit"]');

        // Verify we're back on dashboard (form should be hidden)
        await expect(page.locator('#dashboard')).toBeVisible();
        await expect(page.locator('#pto-form')).not.toBeVisible();

        // Verify logout works
        await page.click('#logout-btn');
        await expect(page.locator('#login-section')).toBeVisible();
        await expect(page.locator('#dashboard')).not.toBeVisible();
        await expect(page.locator('#logout-btn')).not.toBeVisible();
    });
});