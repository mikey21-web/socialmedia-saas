---
name: react-hook-form
description: Build forms with React Hook Form and Zod validation. Use when creating React forms, implementing form validation, handling form submission, managing field arrays, or integrating with UI libraries like shadcn/MUI/Chakra.
---

# React Hook Form Expert Guide

## Setup

```bash
npm install react-hook-form zod @hookform/resolvers
```

## Basic Form with Zod Validation

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  age: z.number({ invalid_type_error: 'Age must be a number' }).min(18, 'Must be 18+').optional(),
  role: z.enum(['user', 'admin'], { required_error: 'Select a role' }),
  bio: z.string().max(500).optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept terms' }) }),
})

type FormData = z.infer<typeof schema>

function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    reset,
    watch,
    setValue,
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', role: 'user' },
    mode: 'onBlur',  // validate on blur; 'onChange', 'onSubmit', 'all'
  })

  const onSubmit = async (data: FormData) => {
    try {
      await saveProfile(data)
      reset()  // clear form after success
    } catch (err) {
      // Set server-side error
      setError('email', { message: 'Email already taken' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          {...register('name')}
          className={errors.name ? 'border-red-500' : 'border-gray-300'}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="role">Role</label>
        <select id="role" {...register('role')}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
      </div>

      <div>
        <input id="terms" type="checkbox" {...register('acceptTerms')} />
        <label htmlFor="terms"> Accept terms</label>
        {errors.acceptTerms && <p className="text-red-500 text-sm">{errors.acceptTerms.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

## Controller (for custom/UI library inputs)

```tsx
import { Controller } from 'react-hook-form'

// For components that don't work with register() — controlled inputs, custom pickers
<Controller
  name="category"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <div>
      <CustomSelect
        value={field.value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        options={categories}
      />
      {error && <p>{error.message}</p>}
    </div>
  )}
/>

// DatePicker
<Controller
  name="birthDate"
  control={control}
  render={({ field }) => (
    <DatePicker
      selected={field.value}
      onChange={(date) => field.onChange(date)}
    />
  )}
/>
```

## Field Arrays (Dynamic Lists)

```tsx
import { useFieldArray } from 'react-hook-form'

const schema = z.object({
  users: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email(),
  })).min(1, 'Add at least one user'),
})

function MultiUserForm() {
  const { control, register, formState: { errors } } = useForm({ resolver: zodResolver(schema) })
  const { fields, append, remove, move } = useFieldArray({ control, name: 'users' })

  return (
    <form>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`users.${index}.name`)} placeholder="Name" />
          {errors.users?.[index]?.name && <p>{errors.users[index].name.message}</p>}
          <input {...register(`users.${index}.email`)} placeholder="Email" />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: '', email: '' })}>
        Add User
      </button>
      {errors.users?.root && <p>{errors.users.root.message}</p>}
    </form>
  )
}
```

## Watch & Conditional Fields

```tsx
const selectedRole = watch('role')
const password = watch('password')

// Conditional validation with superRefine
const schema = z.object({
  role: z.enum(['user', 'admin']),
  adminCode: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'admin' && !data.adminCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Admin code required for admin role',
      path: ['adminCode'],
    })
  }
})

// In JSX
{selectedRole === 'admin' && (
  <input {...register('adminCode')} placeholder="Admin code" />
)}
```

## Integration with shadcn/ui

```tsx
// Use Form components from shadcn
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const form = useForm<FormData>({ resolver: zodResolver(schema) })

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="you@example.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

## Common Zod Patterns

```typescript
// Password confirmation
z.object({
  password: z.string().min(8),
  confirm: z.string(),
}).refine(data => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
})

// URL
z.string().url('Must be a valid URL')

// Phone
z.string().regex(/^\+?[\d\s-()]{10,}$/, 'Invalid phone number')

// File
z.instanceof(FileList).refine(files => files.length > 0, 'Required')
  .refine(files => files[0].size < 5_000_000, 'Max 5MB')
  .refine(files => ['image/jpeg', 'image/png'].includes(files[0].type), 'JPEG or PNG only')

// Numeric string
z.string().transform(Number).pipe(z.number().positive())
```
