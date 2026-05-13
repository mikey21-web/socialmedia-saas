---
name: dom-testing-library
description: Test web UIs with DOM Testing Library (vanilla JS/TS, without React). Use when testing plain HTML/JS interactions, using @testing-library/dom directly, querying DOM elements by role/text/label, or testing non-React frameworks (Angular, Vue, Svelte) with Testing Library.
---

# DOM Testing Library Expert Guide

## Installation

```bash
# Core library (framework-agnostic)
npm install --save-dev @testing-library/dom @testing-library/jest-dom

# For specific frameworks:
npm install --save-dev @testing-library/react         # React
npm install --save-dev @testing-library/vue           # Vue
npm install --save-dev @testing-library/angular       # Angular
npm install --save-dev @testing-library/svelte        # Svelte
npm install --save-dev @testing-library/user-event    # User interactions
```

## Setup (jest.setup.ts)

```typescript
import '@testing-library/jest-dom'  // adds custom matchers: toBeInTheDocument(), etc.
```

```json
// jest.config.ts
{
  "setupFilesAfterFramework": ["<rootDir>/jest.setup.ts"]
}
```

## Core Concepts: Queries

```typescript
import { getByRole, getByText, queryByText, findByText, screen } from '@testing-library/dom'

// Query methods:
// getBy*   → throws if not found (use for elements that MUST exist)
// queryBy* → returns null if not found (use to assert non-existence)
// findBy*  → async, waits for element (use for async operations)
// getAllBy*, queryAllBy*, findAllBy* → return arrays

// Priority order (most accessible → least):
// 1. getByRole       — best: matches by ARIA role + accessible name
// 2. getByLabelText  — for form fields
// 3. getByPlaceholderText
// 4. getByText       — for text content
// 5. getByDisplayValue
// 6. getByAltText    — for images
// 7. getByTitle
// 8. getByTestId     — last resort: data-testid attribute
```

## Querying by Role (Recommended)

```typescript
import { render, screen } from '@testing-library/react'  // or vue/svelte

// Common ARIA roles:
screen.getByRole('button', { name: /submit/i })
screen.getByRole('heading', { level: 1 })  // <h1>
screen.getByRole('link', { name: 'Home' })
screen.getByRole('textbox', { name: /email/i })
screen.getByRole('checkbox', { name: /agree/i })
screen.getByRole('combobox')  // <select>
screen.getByRole('listitem')  // <li>
screen.getByRole('dialog')    // modal
screen.getByRole('alert')     // alert messages
screen.getByRole('img', { name: /profile photo/i })  // <img alt="profile photo">
screen.getByRole('navigation')  // <nav>
screen.getByRole('main')       // <main>

// Hidden elements
screen.getByRole('button', { name: 'X', hidden: true })
```

## Direct DOM Testing (no framework)

```typescript
import { getByRole, getByText, fireEvent } from '@testing-library/dom'

test('form submission', () => {
  // Set up DOM
  document.body.innerHTML = `
    <form>
      <label for="email">Email</label>
      <input id="email" type="email" />
      <button type="submit">Subscribe</button>
    </form>
  `

  // Query
  const input = getByRole(document.body, 'textbox', { name: /email/i })
  const button = getByRole(document.body, 'button', { name: /subscribe/i })

  // Interact
  fireEvent.change(input, { target: { value: 'user@example.com' } })
  fireEvent.click(button)

  // Assert
  expect(input).toHaveValue('user@example.com')
})
```

## Vue Testing Library

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import UserCard from './UserCard.vue'

test('displays user name and handles edit', async () => {
  const user = userEvent.setup()

  const { emitted } = render(UserCard, {
    props: { user: { id: '1', name: 'Alice', email: 'alice@example.com' } },
  })

  expect(screen.getByText('Alice')).toBeInTheDocument()
  expect(screen.getByText('alice@example.com')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /edit/i }))

  expect(emitted().edit).toBeTruthy()
  expect(emitted().edit[0]).toEqual([{ id: '1', name: 'Alice', email: 'alice@example.com' }])
})

test('shows loading state', async () => {
  render(UserList)

  // findBy* waits for element to appear
  const items = await screen.findAllByRole('listitem')
  expect(items).toHaveLength(3)
})
```

## Svelte Testing Library

```typescript
import { render, screen, fireEvent } from '@testing-library/svelte'
import Counter from './Counter.svelte'

test('increments count on click', async () => {
  render(Counter, { props: { initialCount: 0 } })

  const button = screen.getByRole('button', { name: /increment/i })
  const count = screen.getByTestId('count')

  expect(count).toHaveTextContent('0')

  await fireEvent.click(button)

  expect(count).toHaveTextContent('1')
})
```

## Angular Testing Library

```typescript
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { UserFormComponent } from './user-form.component'

test('submits form with valid data', async () => {
  const user = userEvent.setup()
  const onSubmit = jest.fn()

  await render(UserFormComponent, {
    componentProperties: { submitForm: onSubmit },
  })

  await user.type(screen.getByLabelText(/name/i), 'Alice')
  await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
  await user.click(screen.getByRole('button', { name: /save/i }))

  expect(onSubmit).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com' })
})
```

## jest-dom Matchers

```typescript
// Presence
expect(element).toBeInTheDocument()
expect(element).not.toBeInTheDocument()

// Visibility
expect(element).toBeVisible()
expect(element).not.toBeVisible()

// State
expect(checkbox).toBeChecked()
expect(button).toBeDisabled()
expect(button).toBeEnabled()
expect(input).toBeRequired()
expect(element).toBeEmptyDOMElement()

// Values
expect(input).toHaveValue('alice@example.com')
expect(input).toHaveDisplayValue('Option A')
expect(element).toHaveTextContent('Hello World')
expect(element).toHaveTextContent(/hello/i)  // regex

// Attributes/Classes
expect(element).toHaveAttribute('type', 'submit')
expect(element).toHaveClass('btn-primary')
expect(form).toHaveFormValues({ email: 'test@test.com', remember: true })

// Focus
expect(input).toHaveFocus()
```

## Async Queries

```typescript
import { waitFor, waitForElementToBeRemoved } from '@testing-library/dom'

// Wait for element to appear
const button = await screen.findByRole('button', { name: /save/i })

// Wait for condition
await waitFor(() => {
  expect(screen.getByText('Saved!')).toBeInTheDocument()
})

// Wait for element to disappear
await waitForElementToBeRemoved(() => screen.queryByText('Loading...'))

// With timeout
await waitFor(
  () => expect(screen.getByRole('alert')).toBeInTheDocument(),
  { timeout: 3000 }
)
```

## Debugging

```typescript
// Print entire DOM to console
screen.debug()

// Print specific element
screen.debug(screen.getByRole('form'))

// Get accessible roles in current DOM
import { logRoles } from '@testing-library/dom'
logRoles(document.body)

// Useful error: "Unable to find role 'button'"
// Fix: check element has correct role, or use screen.debug() to see actual DOM
```
