---
name: redux
description: Manage React state with Redux Toolkit (RTK). Use when implementing Redux slices, RTK Query for data fetching, setting up the Redux store, implementing async thunks, or migrating from legacy Redux to Redux Toolkit.
---

# Redux Toolkit (RTK) Expert Guide

Always use **Redux Toolkit** (RTK), never bare Redux — it eliminates boilerplate and includes best practices.

## When to Use Redux vs Zustand

| Use Redux when | Use Zustand when |
|----------------|-----------------|
| Large team, need strict patterns | Small-medium app |
| Complex state interactions | Simple global state |
| Need RTK Query for data fetching | Custom data fetching logic |
| Existing Redux codebase | Starting fresh |

## Setup

```bash
npm install @reduxjs/toolkit react-redux
```

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import userReducer from './slices/userSlice'
import { api } from './services/api'

export const store = configureStore({
  reducer: {
    user: userReducer,
    [api.reducerPath]: api.reducer,  // RTK Query
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
})

setupListeners(store.dispatch)  // for refetchOnFocus/refetchOnReconnect

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

```typescript
// hooks/redux.ts — typed hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
```

## Slice

```typescript
// store/slices/userSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'

interface UserState {
  currentUser: User | null
  users: User[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

// Async thunk
export const fetchUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/users')
    if (!response.ok) throw new Error('Failed to fetch')
    return await response.json()
  } catch (err) {
    return rejectWithValue((err as Error).message)
  }
})

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    users: [],
    status: 'idle',
    error: null,
  } as UserState,

  reducers: {
    setCurrentUser(state, action: PayloadAction<User | null>) {
      state.currentUser = action.payload
    },
    updateUser(state, action: PayloadAction<{ id: string; updates: Partial<User> }>) {
      const user = state.users.find(u => u.id === action.payload.id)
      if (user) Object.assign(user, action.payload.updates)  // immer: mutate directly
    },
    removeUser(state, action: PayloadAction<string>) {
      state.users = state.users.filter(u => u.id !== action.payload)
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.status = 'loading' })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
  },
})

export const { setCurrentUser, updateUser, removeUser } = userSlice.actions
export default userSlice.reducer
```

## Selectors

```typescript
// store/selectors/userSelectors.ts
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../index'

// Basic selectors
export const selectAllUsers = (state: RootState) => state.user.users
export const selectUserStatus = (state: RootState) => state.user.status
export const selectCurrentUser = (state: RootState) => state.user.currentUser

// Memoized selector (only recomputes when users changes)
export const selectAdminUsers = createSelector(
  selectAllUsers,
  (users) => users.filter(u => u.role === 'admin')
)

// Parameterized selector
export const selectUserById = (id: string) =>
  createSelector(selectAllUsers, (users) => users.find(u => u.id === id))
```

## RTK Query (data fetching)

```typescript
// store/services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.currentUser?.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['User', 'Post'],

  endpoints: (builder) => ({
    getUsers: builder.query<User[], { search?: string; page?: number }>({
      query: (params) => ({ url: '/users', params }),
      providesTags: ['User'],
    }),

    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation<User, CreateUserDto>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],  // refetch user list after creation
    }),

    updateUser: builder.mutation<User, { id: string; updates: Partial<User> }>({
      query: ({ id, updates }) => ({ url: `/users/${id}`, method: 'PUT', body: updates }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),
  }),
})

export const { useGetUsersQuery, useGetUserQuery, useCreateUserMutation, useUpdateUserMutation } = api
```

## Usage in Components

```tsx
// RTK Query
function UserList() {
  const { data: users, isLoading, error } = useGetUsersQuery({ page: 1 })
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage />

  return (
    <>
      {users?.map(user => <UserCard key={user.id} user={user} />)}
      <button onClick={() => createUser({ name: 'New User', email: 'new@example.com' })} disabled={isCreating}>
        Add User
      </button>
    </>
  )
}

// Redux state
function Profile() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const status = useAppSelector(selectUserStatus)

  useEffect(() => { dispatch(fetchUsers()) }, [dispatch])

  return <div>{user?.name}</div>
}
```

```tsx
// Provider setup in app root
import { Provider } from 'react-redux'
import { store } from './store'

<Provider store={store}>
  <App />
</Provider>
```
