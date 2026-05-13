// Minimal stub for @nestjs/config — install the real package via: npm install @nestjs/config
declare module '@nestjs/config' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class ConfigModule {
    static forRoot(options?: Record<string, unknown>): any;
    static forFeature(config: () => Record<string, unknown>): any;
  }

  export class ConfigService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(key: string, defaultValue?: unknown): any;
    getOrThrow(key: string): string;
  }
}
