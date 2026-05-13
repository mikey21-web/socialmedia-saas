---
name: react-testing-library
description: Test React components with React Testing Library. Use when writing component tests, testing user interactions, querying DOM elements, testing forms/hooks/async components, or implementing RTL best practices.
---

# React Testing Library Expert Guide

## Philosophy

**Test behavior, not implementation.** Query elements the way users find them (by text, role, label) — not by CSS class or component internals.

```
Users interact with: visible text, labels, roles, placeholder text
They DON'T interact with: className, component name, state variables
```

## Setup

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'  // adds toBeInTheDocument(), etc.
```

## Basic Component Test

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('shows error on invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByText('Invalid email address')).toBeInTheDocument()
  })

  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup()
    const mockSubmit = jest.fn()
    render(<LoginForm onSubmit={mockSubmit} />)

    await user.type(screen.getByLabelText('Email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(mockSubmit).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' })
  })
})
```

## Query Methods (Priority Order)

```typescript
// 1. getByRole — most semantic
screen.getByRole('button', { name: 'Submit' })
screen.getByRole('heading', { name: 'Welcome', level: 1 })
screen.getByRole('textbox', { name: 'Search' })
screen.getByRole('checkbox', { name: 'Remember me' })
screen.getByRole('link', { name: 'Home' })
screen.getByRole('listitem')

// 2. getByLabelText — for form inputs
screen.getByLabelText('Email address')
screen.getByLabelText(/password/i)  // regex, case-insensitive

// 3. getByPlaceholderText
screen.getByPlaceholderText('Search...')

// 4. getByText — visible text
screen.getByText('Submit')
screen.getByText(/error/i)

// 5. getByDisplayValue — for inputs with current value
screen.getByDisplayValue('alice@example.com')

// 6. getByAltText
screen.getByAltText('User avatar')

// 7. getByTestId — LAST resort
screen.getByTestId('submit-btn')

// Variants: get* throws if not found, query* returns null, find* is async
const maybeEl = screen.queryByText('optional')  // null if not found
const asyncEl = await screen.findByText('loaded data')  // waits for it
```

## User Event (Simulating User Interactions)

```typescript
import userEvent from '@testing-library/user-event'

// Always set up at the top of describe or test
const user = userEvent.setup()

// Click
await user.click(screen.getByRole('button'))
await user.dblClick(element)

// Typing
await user.type(screen.getByLabelText('Email'), 'a@b.com')
await user.clear(input)
await user.type(input, '{backspace}')  // special keys

// Keyboard
await user.keyboard('{Enter}')
await user.keyboard('{Tab}')
await user.keyboard('{Ctrl>}a{/Ctrl}')  // Ctrl+A

// Select
await user.selectOptions(select, 'option-value')

// Hover
await user.hover(element)
await user.unhover(element)

// Upload
await user.upload(fileInput, file)
```

## Async Testing

```typescript
// waitFor — wait for assertion to pass
import { waitFor } from '@testing-library/react'

test('loads and displays data', async () => {
  render(<UserList />)

  // Initially shows loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument()

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
})

// findBy* — async query (most readable)
test('shows notification', async () => {
  render(<NotificationSystem />)
  const notification = await screen.findByRole('alert')
  expect(notification).toHaveTextContent('Saved successfully')
})
```

## Mock API Calls

```typescript
// With jest.mock
jest.mock('../api/users', () => ({
  fetchUsers: jest.fn().mockResolvedValue([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]),
}))

// With MSW (recommended for complex scenarios)
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json([{ id: 1, name: 'Alice' }])
  })
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Testing Custom Hooks

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

test('increments counter', () => {
  const { result } = renderHook(() => useCounter(0))

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})

test('hook with provider', () => {
  const wrapper = ({ children }) => (
    <ThemeProvider theme="dark">{children}</ThemeProvider>
  )
  const { result } = renderHook(() => useTheme(), { wrapper })
  expect(result.current.theme).toBe('dark')
})
```

## jest-dom Matchers

```typescript
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toBeEnabled()
expect(element).toBeChecked()
expect(element).toHaveValue('text')
expect(element).toHaveDisplayValue('Option 1')
expect(element).toHaveTextContent('Hello world')
expect(element).toHaveAttribute('href', '/home')
expect(element).toHaveClass('active')
expect(element).toHaveFocus()
expect(element).toBeRequired()
```

## Common Anti-Patterns

```typescript
// ❌ Testing by className (implementation detail)
expect(container.querySelector('.submit-btn')).toBeInTheDocument()

// ✅ Test by role
expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()

// ❌ Testing state directly
expect(component.state.isOpen).toBe(true)

// ✅ Test what user sees
expect(screen.getByRole('dialog')).toBeVisible()

// ❌ Snapshot everything
expect(container).toMatchSnapshot()

// ✅ Targeted assertions about specific behavior
expect(screen.getByText('Welcome, Alice!')).toBeInTheDocument()
```
