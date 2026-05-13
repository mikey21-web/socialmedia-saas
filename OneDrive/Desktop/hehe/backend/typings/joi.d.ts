// Minimal stub for joi — real package should be installed via npm install
declare module 'joi' {
  export interface Schema {
    required(): this;
    optional(): this;
    default(value?: unknown): this;
    min(limit: number): this;
    max(limit: number): this;
    integer(): this;
    uri(options?: Record<string, unknown>): this;
    email(options?: Record<string, unknown>): this;
    valid(...values: unknown[]): this;
    options(options: Record<string, unknown>): this;
    description(desc: string): this;
  }

  export interface StringSchema extends Schema {
    min(limit: number): this;
    max(limit: number): this;
    uri(options?: Record<string, unknown>): this;
    email(options?: Record<string, unknown>): this;
    valid(...values: unknown[]): this;
    pattern(regex: RegExp): this;
  }

  export interface NumberSchema extends Schema {
    integer(): this;
    min(limit: number): this;
    max(limit: number): this;
  }

  export interface BooleanSchema extends Schema {}

  export interface ObjectSchema extends Schema {
    keys(keys: Record<string, Schema>): this;
    unknown(allow?: boolean): this;
    options(options: Record<string, unknown>): this;
  }

  export interface ArraySchema extends Schema {
    items(...types: Schema[]): this;
  }

  export function string(): StringSchema;
  export function number(): NumberSchema;
  export function boolean(): BooleanSchema;
  export function object(schema?: Record<string, Schema>): ObjectSchema;
  export function array(): ArraySchema;
  export function any(): Schema;

  export interface Root {
    string(): StringSchema;
    number(): NumberSchema;
    boolean(): BooleanSchema;
    object(schema?: Record<string, Schema>): ObjectSchema;
    array(): ArraySchema;
    any(): Schema;
  }
}
