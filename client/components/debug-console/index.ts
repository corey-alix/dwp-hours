export class DebugConsole extends HTMLElement {
  private shadow: ShadowRoot;
  private details: HTMLDetailsElement;
  private summary: HTMLElement;
  private content: HTMLElement;
  private clearButton: HTMLButtonElement;
  private messages: string[] = [];
  private maxMessages = 100; // Limit to prevent memory issues
  private originalConsoleLog!: typeof console.log;
  private originalConsoleWarn!: typeof console.warn;
  private originalConsoleError!: typeof console.error;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    // Create the details element
    this.details = document.createElement("details");
    this.details.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 400px;
      max-height: 300px;
      background: var(--color-background);
      border: 1px solid var(--color-surface);
      border-radius: 4px;
      z-index: 9999;
      font-family: monospace;
      font-size: 12px;
      overflow: hidden;
    `;

    // Create summary with title and clear button
    this.summary = document.createElement("summary");
    this.summary.style.cssText = `
      padding: 8px;
      background: var(--color-surface);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    this.summary.textContent = "Debug Console";

    this.clearButton = document.createElement("button");
    this.clearButton.textContent = "Clear";
    this.clearButton.style.cssText = `
      background: var(--color-error);
      color: white;
      border: none;
      padding: 2px 6px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 10px;
    `;
    this.clearButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.clearMessages();
    });

    this.summary.appendChild(this.clearButton);

    // Create content area
    this.content = document.createElement("div");
    this.content.style.cssText = `
      max-height: 250px;
      overflow-y: auto;
      padding: 8px;
      background: var(--color-background);
    `;

    this.details.appendChild(this.summary);
    this.details.appendChild(this.content);
    this.shadow.appendChild(this.details);

    this.setupConsoleInterception();
  }

  private setupConsoleInterception() {
    // Store originals
    this.originalConsoleLog = console.log;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleError = console.error;

    // Override console methods
    console.log = (...args: any[]) => {
      this.addMessage("log", ...args);
      this.originalConsoleLog(...args);
    };

    console.warn = (...args: any[]) => {
      this.addMessage("warn", ...args);
      this.originalConsoleWarn(...args);
    };

    console.error = (...args: any[]) => {
      this.addMessage("error", ...args);
      this.originalConsoleError(...args);
    };
  }

  private addMessage(level: string, ...args: any[]) {
    const timestamp = new Date().toLocaleTimeString();
    const message = `[${timestamp}] ${level.toUpperCase()}: ${args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      )
      .join(" ")}`;

    this.messages.unshift(message); // Add to beginning (newest first)

    // Limit messages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(0, this.maxMessages);
    }

    this.updateDisplay();
  }

  private updateDisplay() {
    this.content.innerHTML = this.messages
      .map((msg) => {
        const level = msg.match(/(\w+):/)?.[1] || "log";
        const color =
          level === "ERROR"
            ? "var(--color-error)"
            : level === "WARN"
              ? "var(--color-warning, orange)"
              : "var(--color-text)";
        return `<div style="margin-bottom: 4px; color: ${color};">${msg}</div>`;
      })
      .join("");
  }

  private clearMessages() {
    this.messages = [];
    this.updateDisplay();
  }

  disconnectedCallback() {
    // Restore original console methods
    if (this.originalConsoleLog) console.log = this.originalConsoleLog;
    if (this.originalConsoleWarn) console.warn = this.originalConsoleWarn;
    if (this.originalConsoleError) console.error = this.originalConsoleError;
  }
}

// Register the component
if (!customElements.get("debug-console")) {
  customElements.define("debug-console", DebugConsole);
}
