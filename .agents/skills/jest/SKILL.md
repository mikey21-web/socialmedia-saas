---
name: jest
description: Write and configure Jest tests for JavaScript/TypeScript projects. Use when writing unit tests, integration tests, setting up Jest config, mocking modules/APIs, testing async code, writing snapshot tests, or measuring code coverage with Jest.
---

# Jest Testing Expert Guide

## Setup

```bash
npm install -D jest @types/jest ts-jest
# For React:
npm install -D @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',    // or 'jsdom' for browser
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',  // path aliases
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageThreshold: { global: { lines: 80 } },
}
```

## Test Structure

```typescript
describe('UserService', () => {
  // Runs before each test in this block
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Group related tests
  describe('createUser', () => {
    it('creates user with valid data', async () => {
      // Arrange
      const userData = { email: 'a@b.com', name: 'Alice' }

      // Act
      const user = await UserService.create(userData)

      // Assert
      expect(user.id).toBeDefined()
      expect(user.email).toBe('a@b.com')
      expect(user.name).toBe('Alice')
    })

    it('throws on duplicate email', async () => {
      await UserService.create({ email: 'a@b.com', name: 'Alice' })
      await expect(
        UserService.create({ email: 'a@b.com', name: 'Bob' })
      ).rejects.toThrow('Email already exists')
    })
  })
})
```

## Matchers

```typescript
// Equality
expect(value).toBe(42)          // strict equality (===)
expect(obj).toEqual({ a: 1 })   // deep equality
expect(arr).toContain('item')
expect(obj).toMatchObject({ key: 'value' })  // partial match

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// Numbers
expect(num).toBeGreaterThan(0)
expect(num).toBeCloseTo(3.14, 2)  // floating point

// Strings
expect(str).toMatch(/pattern/)
expect(str).toContain('substring')

// Arrays
expect(arr).toHaveLength(3)
expect(arr).toContainEqual({ id: 1 })

// Errors
expect(() => fn()).toThrow()
expect(() => fn()).toThrow('specific message')
await expect(asyncFn()).rejects.toThrow('error')

// Mock assertions
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(2)
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenLastCalledWith('last-arg')
```

## Mocking

```typescript
// Mock a module
jest.mock('./emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ sent: true }),
}))

// Mock specific function
import { sendEmail } from './emailService'
const mockSendEmail = jest.mocked(sendEmail)
mockSendEmail.mockResolvedValueOnce({ sent: true })

// jest.fn() for creating mocks
const mockCallback = jest.fn()
mockCallback.mockReturnValue(42)
mockCallback.mockReturnValueOnce(1).mockReturnValueOnce(2)  // different values
mockCallback.mockResolvedValue({ data: 'async result' })
mockCallback.mockRejectedValue(new Error('failed'))

// Spy on existing method
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
// ... test code ...
expect(consoleSpy).toHaveBeenCalledWith('error message')
consoleSpy.mockRestore()

// Mock entire class
jest.mock('./Database')
const mockDB = jest.mocked(Database)
mockDB.prototype.query.mockResolvedValue([{ id: 1 }])
```

## Async Testing

```typescript
// async/await (preferred)
it('fetches data', async () => {
  const data = await fetchUser(1)
  expect(data.name).toBe('Alice')
})

// Resolves/rejects
it('resolves correctly', () => {
  return expect(fetchUser(1)).resolves.toMatchObject({ name: 'Alice' })
})

it('rejects on error', () => {
  return expect(fetchUser(-1)).rejects.toThrow('User not found')
})

// Testing with timers
it('calls callback after delay', () => {
  jest.useFakeTimers()
  const cb = jest.fn()
  debounce(cb, 1000)
  jest.advanceTimersByTime(1000)
  expect(cb).toHaveBeenCalled()
  jest.useRealTimers()
})
```

## Setup & Teardown

```typescript
describe('DatabaseTests', () => {
  let db: Database

  beforeAll(async () => {
    db = await Database.connect()  // runs once before all tests
  })

  afterAll(async () => {
    await db.disconnect()  // runs once after all tests
  })

  beforeEach(async () => {
    await db.clear()  // runs before each test
  })

  afterEach(() => {
    jest.clearAllMocks()  // runs after each test
  })
})
```

## Coverage

```bash
npx jest --coverage
npx jest --coverage --coverageReporters=text-summary
npx jest --coverage --collectCoverageFrom='src/**/*.ts'
```

Coverage types:
- **Statements**: % of statements executed
- **Branches**: % of if/else branches taken
- **Functions**: % of functions called
- **Lines**: % of lines executed

## Common Patterns

```typescript
// Test each case with test.each
test.each([
  [1, 2, 3],
  [0, 0, 0],
  [-1, 1, 0],
])('add(%i, %i) = %i', (a, b, expected) => {
  expect(add(a, b)).toBe(expected)
})

// Skip / focus
it.skip('this test is skipped', ...)
it.only('only run this test', ...)  // watch out: don't commit with .only!

// Custom error message
expect(result).toBe(expected) // default: "Expected 3 but received 5"
// Better:
expect(result, `calculate(${a}, ${b}) should equal ${expected}`).toBe(expected)
```

## What to Test

| ✅ Test | ❌ Don't test |
|--------|-------------|
| Business logic | Third-party library internals |
| Edge cases (null, empty, boundary) | Implementation details (private methods) |
| Error paths | Already-tested framework behavior |
| Integration between your components | Trivial getters/setters |
