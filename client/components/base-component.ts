export abstract class BaseComponent extends HTMLElement {
  public shadowRoot!: ShadowRoot;
  private eventListeners: {
    element: EventTarget;
    event: string;
    handler: EventListener;
  }[] = [];
  private isEventDelegationSetup = false;
  private _isConnected = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._isConnected = true;
    this.setupEventDelegation();
    this.update();
  }

  disconnectedCallback() {
    this._isConnected = false;
    this.cleanupEventListeners();
  }

  // LitElement-inspired update cycle
  protected update() {
    if (!this._isConnected) return;

    const templateResult = this.render();
    if (templateResult !== undefined) {
      this.renderTemplate(templateResult);
    }
  }

  // Event delegation pattern for dynamic content
  protected setupEventDelegation() {
    if (this.isEventDelegationSetup) return;

    this.shadowRoot.addEventListener("click", (e) => {
      this.handleDelegatedClick(e);
    });

    this.shadowRoot.addEventListener("submit", (e) => {
      this.handleDelegatedSubmit(e);
    });

    this.shadowRoot.addEventListener("keydown", (e) => {
      this.handleDelegatedKeydown(e as KeyboardEvent);
    });

    this.isEventDelegationSetup = true;
  }

  // Override in subclasses for specific click handling
  protected handleDelegatedClick(e: Event): void {
    // Subclasses implement specific logic
  }

  // Override in subclasses for form submissions
  protected handleDelegatedSubmit(e: Event): void {
    // Subclasses implement specific logic
  }

  // Override in subclasses for keyboard events
  protected handleDelegatedKeydown(e: KeyboardEvent): void {
    // Subclasses implement specific logic
  }

  // Safe event listener management
  protected addListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
  ) {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  protected removeAllListeners() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  // Cleanup method for subclasses
  protected cleanupEventListeners() {
    this.removeAllListeners();
  }

  // LitElement-inspired render method (abstract)
  protected abstract render(): string | undefined;

  // Template rendering with automatic cleanup
  protected renderTemplate(template: string): void {
    // Clean up listeners before re-rendering
    this.cleanupEventListeners();
    this.shadowRoot.innerHTML = template;
    // Re-setup delegation after render
    this.setupEventDelegation();
  }

  // Force re-render (LitElement-inspired)
  protected requestUpdate() {
    if (this._isConnected) {
      this.update();
    }
  }
}
