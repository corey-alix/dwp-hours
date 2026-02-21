/** Utility: extract ':param' segments from a path string. */
type PathParam<T extends string> = T extends `${infer _}:${infer P}/${infer R}`
  ? P | PathParam<R>
  : T extends `${infer _}:${infer P}`
    ? P
    : never;

type ParamsFromPath<TPath extends string> = Record<PathParam<TPath>, string>;

/** Lifecycle hooks a page component can implement. */
export interface PageComponent extends HTMLElement {
  /**
   * Called by the router after the element is placed in the DOM.
   * Receives route params and the result of the route's loader (if any).
   */
  onRouteEnter?(
    params: Record<string, string>,
    search: URLSearchParams,
    loaderData?: unknown,
  ): void | Promise<void>;

  /**
   * Called by the router when navigating away.
   * Return `false` to block navigation (unsaved changes).
   */
  onRouteLeave?(): boolean | Promise<boolean>;
}

export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  roles?: string[];
  icon?: string;
  [key: string]: unknown;
}

export interface Route<TPath extends string = string> {
  path: TPath;

  /** Tag name of the page web component to render (e.g. "login-page"). */
  component: string;

  /** Human-readable label for navigation menus. */
  name?: string;

  meta?: RouteMeta;

  /** Async data loader invoked before the component is rendered. */
  loader?: (
    params: ParamsFromPath<TPath>,
    search: URLSearchParams,
  ) => Promise<unknown> | unknown;

  /** Component tag to render on loader/render error. */
  errorComponent?: string;

  /** Component tag to show while loader is pending. */
  pendingComponent?: string;

  children?: Route<string>[];
}

export type AppRoutes = Route<string>[];
