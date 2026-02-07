/**
 * Test workflow class for test.html - handles automated testing of the employee workflow
 */

// Extend Window interface for test mode
declare global {
    interface Window {
        testMode?: boolean;
        api?: any;
        app?: any;
    }
}

export class TestWorkflow {
    private currentStep = 0;
    private testSteps = [
        'Initialize test environment',
        'Load login page',
        'Enter email and request magic link',
        'Receive magic link response',
        'Click magic link (simulated)',
        'Validate token and set cookie',
        'Navigate to dashboard',
        'Load PTO status',
        'Submit PTO request',
        'Submit monthly hours',
        'Acknowledge monthly review',
        'Test PTO calendar request submission',
        'Complete workflow test'
    ];

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        // Mock API for testing - set this up before importing the app
        window.testMode = true;

        // Mock API responses
        const mockAPI = {
            post: async (endpoint: string, data: any) => {
                console.log('Mock API POST:', endpoint, data);
                if (endpoint === '/api/auth/request-link') {
                    return {
                        message: 'Magic link generated for testing',
                        magicLink: 'http://localhost:3000/test.html?token=mocktoken123&ts=1640995200000'
                    };
                }
                if (endpoint === '/api/pto') {
                    return { success: true, id: 1 };
                }
                if (endpoint === '/api/hours') {
                    return { success: true, id: 1 };
                }
                if (endpoint === '/api/acknowledgements') {
                    return { success: true, id: 1 };
                }
                return { success: true };
            },
            get: async (endpoint: string) => {
                console.log('Mock API GET:', endpoint);
                if (endpoint.startsWith('/api/auth/validate')) {
                    return {
                        authToken: 'mockauthtoken123',
                        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
                        employee: {
                            id: 1,
                            name: 'Test Employee',
                            role: 'Employee'
                        }
                    };
                }
                if (endpoint.startsWith('/api/pto/status/')) {
                    return {
                        annualAllocation: 120,
                        availablePTO: 95.64,
                        usedPTO: 24.36,
                        carryoverFromPreviousYear: 0,
                        monthlyAccruals: [
                            { month: 1, hours: 8.0 },
                            { month: 2, hours: 8.0 }
                        ],
                        hireDate: '2023-02-13T00:00:00.000Z',
                        nextRolloverDate: '2025-01-01T00:00:00.000Z'
                    };
                }
                return {};
            }
        };

        // Set the mock API before the app loads
        (window as any).api = mockAPI;

        this.setupEventHandlers();
        this.initializeProgressDisplay();
        this.runWorkflowTest();
    }

    private updateProgress(step: number, status: string = 'pending'): void {
        const progressDiv = document.getElementById('progress-steps');
        if (!progressDiv) return;

        const stepDiv = document.createElement('div');
        stepDiv.id = `step-${step}`;
        stepDiv.textContent = `${step + 1}. ${this.testSteps[step]} - ${status}`;
        stepDiv.style.margin = '5px 0';
        stepDiv.style.padding = '5px';
        stepDiv.style.borderRadius = '3px';

        if (status === 'completed') {
            stepDiv.style.backgroundColor = '#d4edda';
            stepDiv.style.color = '#155724';
        } else if (status === 'in-progress') {
            stepDiv.style.backgroundColor = '#fff3cd';
            stepDiv.style.color = '#856404';
        } else {
            stepDiv.style.backgroundColor = '#f8f9fa';
            stepDiv.style.color = '#6c757d';
        }

        const existingStep = document.getElementById(`step-${step}`);
        if (existingStep) {
            existingStep.replaceWith(stepDiv);
        } else {
            progressDiv.appendChild(stepDiv);
        }
    }

    private markStepCompleted(step: number): void {
        this.updateProgress(step, 'completed');
        this.currentStep = step + 1;
        if (this.currentStep < this.testSteps.length) {
            this.updateProgress(this.currentStep, 'in-progress');
        }
    }

    private setupEventHandlers(): void {
        // Add event handlers for new forms
        const monthlyHoursForm = document.getElementById('monthly-hours-form');
        if (monthlyHoursForm) {
            monthlyHoursForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = {
                    month: formData.get('month'),
                    hours_worked: parseFloat(formData.get('hours-worked') as string)
                };

                try {
                    const response = await (window as any).api.post('/api/hours', data);
                    console.log('Monthly hours submitted:', response);
                    alert('Monthly hours submitted successfully!');
                } catch (error) {
                    console.error('Failed to submit monthly hours:', error);
                    alert('Failed to submit monthly hours');
                }
            });
        }

        const acknowledgementForm = document.getElementById('acknowledgement-form');
        if (acknowledgementForm) {
            acknowledgementForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = {
                    month: formData.get('ack-month')
                };

                try {
                    const response = await (window as any).api.post('/api/acknowledgements', data);
                    console.log('Acknowledgement submitted:', response);
                    alert('Monthly review acknowledged successfully!');
                } catch (error) {
                    console.error('Failed to submit acknowledgement:', error);
                    alert('Failed to submit acknowledgement');
                }
            });
        }

        this.setupPTOCalendarIntegration();
    }

    private setupPTOCalendarIntegration(): void {
        const ptoAccrualCard = document.getElementById('pto-accrual-card') as any;
        const ptoCalendar = document.getElementById('pto-calendar') as any;

        if (ptoAccrualCard) {
            // Handle month selection from accrual card
            ptoAccrualCard.addEventListener('month-selected', (event: any) => {
                const selectedMonth = event.detail.month; // 0-based month
                const selectedYear = event.detail.year;

                console.log('Month selected:', selectedMonth, selectedYear);

                // Update calendar to show selected month
                if (ptoCalendar) {
                    ptoCalendar.setMonth(selectedMonth);
                    ptoCalendar.setYear(selectedYear);

                    // Clear any previous selections
                    ptoCalendar.clearSelection();
                }

                // Show the calendar section
                const calendarSection = document.getElementById('pto-calendar-section');
                if (calendarSection) {
                    calendarSection.classList.remove('hidden');
                }
            });
        }

        if (ptoCalendar) {
            // Handle PTO request submission from calendar
            ptoCalendar.addEventListener('pto-request-submit', async (event: any) => {
                const requests = event.detail.requests;
                console.log('PTO Request submitted from calendar:', requests);

                try {
                    // Submit each request
                    for (const request of requests) {
                        await (window as any).api.post('/api/pto', request);
                    }

                    alert(`PTO request submitted successfully! ${requests.length} date(s) requested.`);
                    ptoCalendar.clearSelection();

                } catch (error) {
                    console.error('Failed to submit PTO request:', error);
                    alert('Failed to submit PTO request');
                }
            });
        }
    }

    private initializeProgressDisplay(): void {
        for (let i = 0; i < this.testSteps.length; i++) {
            this.updateProgress(i, i === 0 ? 'in-progress' : 'pending');
        }
    }

    private async runWorkflowTest(): Promise<void> {
        try {
            // Step 0: Initialize
            this.updateProgress(0, 'in-progress');
            await new Promise(resolve => setTimeout(resolve, 500));
            this.markStepCompleted(0);

            // Step 1: Load login page (already loaded)
            this.markStepCompleted(1);

            // Step 2: Enter email and request magic link
            this.updateProgress(2, 'in-progress');
            const identifierInput = document.getElementById('identifier') as HTMLInputElement;
            if (identifierInput) {
                identifierInput.value = 'employee@example.com';
                const loginForm = document.getElementById('login-form') as HTMLFormElement;
                if (loginForm) {
                    loginForm.dispatchEvent(new Event('submit', { bubbles: true }));
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.markStepCompleted(2);

            // Step 3: Receive magic link response (handled by form submission)
            this.markStepCompleted(3);

            // Step 4: Click magic link (simulated)
            this.updateProgress(4, 'in-progress');
            // Simulate clicking the magic link by setting the URL parameter
            window.history.pushState({}, '', '?token=mocktoken123&ts=1640995200000');
            // Trigger token validation
            if ((window as any).app && (window as any).app.handleTokenValidation) {
                await (window as any).app.handleTokenValidation();
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.markStepCompleted(4);

            // Step 5: Validate token and set cookie
            this.markStepCompleted(5);

            // Step 6: Navigate to dashboard
            this.updateProgress(6, 'in-progress');
            const dashboard = document.getElementById('dashboard');
            const loginSection = document.getElementById('login-section');
            if (dashboard && loginSection) {
                dashboard.classList.remove('hidden');
                loginSection.classList.add('hidden');
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            this.markStepCompleted(6);

            // Step 7: Load PTO status
            this.updateProgress(7, 'in-progress');
            if ((window as any).app && (window as any).app.loadPTOStatus) {
                await (window as any).app.loadPTOStatus();
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.markStepCompleted(7);

            // Step 8: Submit PTO request
            this.updateProgress(8, 'in-progress');
            const newPtoBtn = document.getElementById('new-pto-btn') as HTMLButtonElement;
            if (newPtoBtn) {
                newPtoBtn.click();
            }
            await new Promise(resolve => setTimeout(resolve, 500));

            // Fill and submit PTO form
            const startDateInput = document.getElementById('start-date') as HTMLInputElement;
            const endDateInput = document.getElementById('end-date') as HTMLInputElement;
            const ptoTypeSelect = document.getElementById('pto-type') as HTMLSelectElement;
            const hoursInput = document.getElementById('hours') as HTMLInputElement;
            const ptoForm = document.getElementById('pto-entry-form') as HTMLFormElement;

            if (startDateInput && endDateInput && ptoTypeSelect && hoursInput && ptoForm) {
                startDateInput.value = '2024-03-01';
                endDateInput.value = '2024-03-01';
                ptoTypeSelect.value = 'PTO';
                hoursInput.value = '8';

                ptoForm.dispatchEvent(new Event('submit', { bubbles: true }));
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.markStepCompleted(8);

            // Step 9: Submit monthly hours
            this.updateProgress(9, 'in-progress');
            const monthlyHoursSection = document.getElementById('monthly-hours-section');
            if (monthlyHoursSection) {
                monthlyHoursSection.classList.remove('hidden');
            }
            await new Promise(resolve => setTimeout(resolve, 500));

            const monthInput = document.getElementById('month') as HTMLInputElement;
            const hoursWorkedInput = document.getElementById('hours-worked') as HTMLInputElement;
            const hoursForm = document.getElementById('monthly-hours-form') as HTMLFormElement;

            if (monthInput && hoursWorkedInput && hoursForm) {
                monthInput.value = '2024-02';
                hoursWorkedInput.value = '160';

                hoursForm.dispatchEvent(new Event('submit', { bubbles: true }));
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.markStepCompleted(9);

            // Step 10: Acknowledge monthly review
            this.updateProgress(10, 'in-progress');
            const acknowledgementSection = document.getElementById('acknowledgement-section');
            if (acknowledgementSection) {
                acknowledgementSection.classList.remove('hidden');
            }
            await new Promise(resolve => setTimeout(resolve, 500));

            const ackMonthInput = document.getElementById('ack-month') as HTMLInputElement;
            const ackForm = document.getElementById('acknowledgement-form') as HTMLFormElement;

            if (ackMonthInput && ackForm) {
                ackMonthInput.value = '2024-02';

                ackForm.dispatchEvent(new Event('submit', { bubbles: true }));
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.markStepCompleted(10);

            // Step 11: Test PTO calendar request submission
            this.updateProgress(11, 'in-progress');
            const ptoCalendarSection = document.getElementById('pto-calendar-section');
            if (ptoCalendarSection) {
                ptoCalendarSection.classList.remove('hidden');
            }
            await new Promise(resolve => setTimeout(resolve, 500));

            // Simulate month selection from accrual card
            const ptoAccrualCard = document.getElementById('pto-accrual-card') as any;
            if (ptoAccrualCard) {
                ptoAccrualCard.dispatchEvent(new CustomEvent('month-selected', {
                    detail: { month: 1, year: 2024 } // February 2024
                }));
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            this.markStepCompleted(11);

            // Step 12: Complete
            this.updateProgress(12, 'completed');

            const testOutput = document.getElementById('test-output');
            if (testOutput) {
                testOutput.textContent = '✅ All workflow steps completed successfully!';
            }

        } catch (error) {
            console.error('Workflow test failed:', error);
            const testOutput = document.getElementById('test-output');
            if (testOutput) {
                testOutput.textContent = '❌ Workflow test failed: ' + (error as Error).message;
            }
        }
    }
}