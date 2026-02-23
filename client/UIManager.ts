import { APIClient } from "./APIClient";
import { AuthService } from "./auth/auth-service";
import { Router, appRoutes } from "./router";
import { notifications } from "./app";
import { DashboardNavigationMenu } from "./components";
import { querySingle, addEventListener } from "./components/test-utils";
import {
  isFirstSessionVisit,
  updateActivityTimestamp,
} from "./shared/activityTracker";
import { getPriorMonth } from "../shared/businessRules";
import { today, parseDate } from "../shared/dateUtils";

// Import page components so they register with customElements
import "./pages/index";

/**
 * Thin application shell.
 * Bootstraps AuthService + Router, wires the navigation menu, and delegates
 * all page rendering to the router.
 */
export class UIManager {
  private authService: AuthService;
  private router: Router;
  private api: APIClient;

  constructor() {
    this.api = new APIClient();
    this.authService = new AuthService(this.api);
    const outlet = querySingle<HTMLElement>("#router-outlet");
    this.router = new Router(appRoutes, outlet, this.authService);
    this.init();
  }

  private async init(): Promise<void> {
    this.setupGlobalListeners();

    // Authenticate
    try {
      const user = await this.authService.initialize();
      if (user) {
        this.showNav(true);

        // Check for unacknowledged prior month on new session
        const shouldPrompt = await this.checkPriorMonthAcknowledgement();

        // Navigate to the current URL (or default)
        const path = window.location.pathname;
        if (shouldPrompt) {
          // Navigation already handled by checkPriorMonthAcknowledgement
        } else if (path === "/" || path === "/login") {
          await this.router.navigate("/submit-time-off");
        } else {
          this.router.start();
        }
      } else {
        this.showNav(false);
        this.router.start();
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/"
        ) {
          await this.router.navigate("/login");
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      this.showNav(false);
      this.router.start();
      await this.router.navigate("/login");
    }
  }

  private setupGlobalListeners(): void {
    // Auth state changes
    window.addEventListener("auth-state-changed", ((e: CustomEvent) => {
      const user = e.detail?.user;
      this.showNav(!!user);
      if (!user) {
        this.router.navigate("/login");
      }
    }) as EventListener);

    // Navigation menu
    try {
      const menu = querySingle<DashboardNavigationMenu>(
        "dashboard-navigation-menu",
      );
      addEventListener(menu, "page-change", (e: CustomEvent) => {
        const page = e.detail.page;
        this.navigateFromPage(page);
      });
      addEventListener(menu, "logout", () => {
        this.authService.logout();
      });
    } catch {
      // Menu not available in test environment
    }

    // Router-navigate events (from page components)
    window.addEventListener("router-navigate", ((e: CustomEvent) => {
      const path = e.detail?.path;
      if (path) this.router.navigate(path);
    }) as EventListener);

    // Login success — navigate to default authenticated page
    window.addEventListener("login-success", ((e: CustomEvent) => {
      const user = e.detail?.user;
      if (user) {
        this.showNav(true);
        this.router.navigate("/submit-time-off");
      }
    }) as EventListener);

    // Route-changed events (update nav menu state & heading)
    window.addEventListener("route-changed", ((e: CustomEvent) => {
      this.updateNavMenu(e.detail?.path);
      this.updateHeading(e.detail?.path);
    }) as EventListener);
  }

  /** Map dashboard-navigation-menu page IDs to router paths. */
  private navigateFromPage(page: string): void {
    const routeMap: Record<string, string> = {
      "submit-time-off": "/submit-time-off",
      "current-year-summary": "/current-year-summary",
      "prior-year-summary": "/prior-year-summary",
      "admin/employees": "/admin/employees",
      "admin/pto-requests": "/admin/pto-requests",
      "admin/monthly-review": "/admin/monthly-review",
      "admin/settings": "/admin/settings",
    };
    const path = routeMap[page] ?? `/${page}`;
    this.router.navigate(path);
  }

  private showNav(visible: boolean): void {
    try {
      const menu = querySingle<DashboardNavigationMenu>(
        "dashboard-navigation-menu",
      );
      if (visible) {
        menu.classList.remove("hidden");
        // Set user role so admin menu items are rendered
        const user = this.authService.getUser();
        if (user) {
          menu.userRole = user.role;
        }
      } else {
        menu.classList.add("hidden");
        menu.userRole = "";
      }
    } catch {
      // Menu not in DOM
    }
  }

  private updateNavMenu(path?: string): void {
    if (!path) return;
    try {
      const menu = querySingle<DashboardNavigationMenu>(
        "dashboard-navigation-menu",
      );
      // Reverse-map path to page ID for the menu
      const pageMap: Record<string, string> = {
        "/submit-time-off": "submit-time-off",
        "/current-year-summary": "current-year-summary",
        "/prior-year-summary": "prior-year-summary",
        "/admin/employees": "admin/employees",
        "/admin/pto-requests": "admin/pto-requests",
        "/admin/monthly-review": "admin/monthly-review",
        "/admin/settings": "admin/settings",
      };
      const pageId = pageMap[path];
      if (pageId) {
        menu.currentPageValue = pageId as any;
      }
    } catch {
      // Menu not available
    }
  }

  private static readonly PAGE_LABELS: Record<string, string> = {
    "/submit-time-off": "Submit Time Off",
    "/current-year-summary": "Current Year Summary",
    "/prior-year-summary": "Prior Year Summary",
    "/admin/employees": "Employee Management",
    "/admin/pto-requests": "PTO Request Queue",
    "/admin/monthly-review": "Monthly Employee Review",
    "/admin/settings": "System Settings",
    "/login": "Login",
  };

  private updateHeading(path?: string): void {
    if (!path) return;
    try {
      const heading = querySingle<HTMLHeadingElement>("h1");
      heading.textContent = UIManager.PAGE_LABELS[path] ?? "DWP Hours Tracker";
    } catch {
      // Heading not in DOM
    }
  }

  /**
   * On new sessions (8+ hours since last activity), check whether the
   * immediately preceding month has been acknowledged by the employee.
   * If not, navigate to that month on the submit-time-off page and show
   * a notification prompting the user to lock it.
   *
   * @returns `true` if navigation was triggered (caller should skip default nav)
   */
  private async checkPriorMonthAcknowledgement(): Promise<boolean> {
    try {
      const firstVisit = isFirstSessionVisit();
      updateActivityTimestamp();

      if (!firstVisit) return false;

      const { acknowledgements } = await this.api.getAcknowledgements();
      const currentDate = today();
      const priorMonth = getPriorMonth(currentDate);
      const { year, month } = parseDate(priorMonth + "-01");

      const isAcknowledged = acknowledgements.some(
        (ack: { month: string }) => ack.month === priorMonth,
      );

      if (isAcknowledged) return false;

      // Navigate to the unacknowledged month
      notifications.info(
        `Please review and lock ${priorMonth} before continuing.`,
      );
      await this.router.navigate(
        `/submit-time-off?month=${month}&year=${year}`,
      );
      return true;
    } catch (error) {
      console.error("Error checking prior month acknowledgement:", error);
      return false;
    }
  }
}
