declare module 'puppeteer' {
  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface Page {
    goto(url: string, options?: { waitUntil?: string }): Promise<void>;
    setContent(html: string, options?: { waitUntil?: string }): Promise<void>;
    setViewport(viewport: { width: number; height: number; deviceScaleFactor?: number }): Promise<void>;
    screenshot(options?: {
      path?: string;
      type?: string;
      fullPage?: boolean;
      omitBackground?: boolean;
    }): Promise<Buffer>;
    evaluate<Args extends unknown[], T>(
      pageFunction: (...args: Args) => T,
      ...args: Args
    ): Promise<T>;
  }

  export function launch(options?: Record<string, unknown>): Promise<Browser>;
}
