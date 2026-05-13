---
name: appwrite
description: Build apps with Appwrite backend-as-a-service. Use when setting up Appwrite databases/collections, implementing Appwrite Auth, using Appwrite Storage/Functions, configuring permissions, or integrating Appwrite SDK with React/Next.js/Vue.
---

# Appwrite Expert Guide

## Setup

```bash
# Self-host with Docker
docker run -it --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:1.5.0

# Web SDK
npm install appwrite

# Node.js SDK (server-side)
npm install node-appwrite
```

```typescript
// lib/appwrite.ts (client-side)
import { Client, Account, Databases, Storage, Functions } from 'appwrite'

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')  // or self-hosted URL
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const functions = new Functions(client)

// Server-side (Node.js)
import { Client, Databases } from 'node-appwrite'

const serverClient = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)  // server API key

export const serverDatabases = new Databases(serverClient)
```

## Authentication

```typescript
import { account } from './lib/appwrite'
import { ID } from 'appwrite'

// Email/Password signup
await account.create(
  ID.unique(),        // userId
  'user@example.com', // email
  'password123',      // password
  'John Doe'          // optional name
)

// Login
const session = await account.createEmailPasswordSession(
  'user@example.com',
  'password123'
)

// Get current user
const user = await account.get()
console.log(user.$id, user.email, user.name)

// Logout (current session)
await account.deleteSession('current')

// Logout (all sessions)
await account.deleteSessions()

// OAuth2
await account.createOAuth2Session(
  'google',           // provider
  'https://app.com/success',
  'https://app.com/failure',
)

// Email verification
await account.createVerification('https://app.com/verify')
// After clicking link:
await account.updateVerification(userId, secret)

// Password reset
await account.createRecovery('user@email.com', 'https://app.com/reset')
await account.updateRecovery(userId, secret, newPassword)

// Update profile
await account.updateName('New Name')
await account.updateEmail('new@email.com', 'currentPassword')
await account.updatePassword('newPassword', 'currentPassword')
```

## Database

```typescript
import { databases } from './lib/appwrite'
import { ID, Query } from 'appwrite'

const DATABASE_ID = 'main'
const POSTS_COLLECTION = 'posts'

// CREATE
const post = await databases.createDocument(
  DATABASE_ID,
  POSTS_COLLECTION,
  ID.unique(),  // document ID, or provide your own
  {
    title: 'Hello World',
    content: 'Post content here',
    published: true,
    authorId: user.$id,
  }
)
console.log(post.$id)

// READ one
const post = await databases.getDocument(
  DATABASE_ID,
  POSTS_COLLECTION,
  'DOCUMENT_ID'
)

// LIST with queries
const result = await databases.listDocuments(
  DATABASE_ID,
  POSTS_COLLECTION,
  [
    Query.equal('published', true),
    Query.orderDesc('$createdAt'),
    Query.limit(20),
    Query.offset(0),
    Query.search('title', 'javascript'),  // full-text search
    Query.greaterThan('views', 100),
    Query.contains('tags', 'tutorial'),
  ]
)
console.log(result.documents, result.total)

// UPDATE
const updated = await databases.updateDocument(
  DATABASE_ID,
  POSTS_COLLECTION,
  'DOCUMENT_ID',
  { title: 'Updated Title' }
)

// DELETE
await databases.deleteDocument(DATABASE_ID, POSTS_COLLECTION, 'DOCUMENT_ID')
```

## Query Builder

```typescript
import { Query } from 'appwrite'

// All query types
Query.equal('field', 'value')
Query.notEqual('field', 'value')
Query.lessThan('field', 100)
Query.lessThanEqual('field', 100)
Query.greaterThan('field', 100)
Query.greaterThanEqual('field', 100)
Query.between('price', 10, 100)
Query.isNull('field')
Query.isNotNull('field')
Query.startsWith('name', 'J')
Query.endsWith('email', '.com')
Query.contains('tags', ['javascript', 'typescript'])
Query.search('content', 'search term')  // full-text search
Query.orderAsc('name')
Query.orderDesc('$createdAt')
Query.limit(25)
Query.offset(50)
Query.cursorAfter('DOCUMENT_ID')  // cursor-based pagination
Query.cursorBefore('DOCUMENT_ID')
Query.select(['$id', 'title', 'created'])  // select fields
```

## Storage (File Uploads)

```typescript
import { storage } from './lib/appwrite'
import { ID } from 'appwrite'

const BUCKET_ID = 'avatars'

// Upload file
const file = await storage.createFile(
  BUCKET_ID,
  ID.unique(),
  fileInput.files[0]  // File object
)

// Get file URL (for images)
const previewUrl = storage.getFilePreview(
  BUCKET_ID,
  file.$id,
  200,  // width
  200,  // height
  'center',  // gravity
  100,  // quality
)

// Get download URL
const downloadUrl = storage.getFileDownload(BUCKET_ID, file.$id)

// Get view URL (inline)
const viewUrl = storage.getFileView(BUCKET_ID, file.$id)

// List files
const files = await storage.listFiles(BUCKET_ID, [Query.limit(10)])

// Delete file
await storage.deleteFile(BUCKET_ID, file.$id)
```

## Permissions

```typescript
import { Permission, Role } from 'appwrite'

// Create document with permissions
await databases.createDocument(
  DATABASE_ID,
  POSTS_COLLECTION,
  ID.unique(),
  { title: 'My Post' },
  [
    Permission.read(Role.any()),           // public read
    Permission.write(Role.user(userId)),   // only owner can write
    Permission.delete(Role.user(userId)),  // only owner can delete
    Permission.read(Role.team('admins')),  // team access
    Permission.write(Role.users()),        // any authenticated user
  ]
)

// Common permission patterns
const publicRead = [Permission.read(Role.any())]
const ownerOnly = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
]
const authOnly = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
]
```

## Realtime

```typescript
import { client } from './lib/appwrite'

// Subscribe to document changes
const unsubscribe = client.subscribe(
  `databases.${DATABASE_ID}.collections.${POSTS_COLLECTION}.documents`,
  (response) => {
    const events = response.events  // e.g. 'databases.*.collections.*.documents.*.create'
    const payload = response.payload

    if (events.includes('databases.*.collections.*.documents.*.create')) {
      console.log('New document:', payload)
    }
    if (events.includes('databases.*.collections.*.documents.*.update')) {
      console.log('Updated:', payload)
    }
    if (events.includes('databases.*.collections.*.documents.*.delete')) {
      console.log('Deleted:', payload)
    }
  }
)

// Unsubscribe
unsubscribe()

// React usage
useEffect(() => {
  const unsub = client.subscribe(`...`, handleChange)
  return () => unsub()
}, [])
```

## Cloud Functions

```typescript
// Trigger a function
const execution = await functions.createExecution(
  'FUNCTION_ID',
  JSON.stringify({ userId: '123' }),  // body
  false,  // async
  '/custom-path',  // path
  'POST',  // method
)
console.log(execution.responseBody)

// Function code (Node.js runtime)
export default async ({ req, res, log, error }) => {
  const body = JSON.parse(req.body)

  // Use Appwrite SDK inside function
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'])

  const databases = new Databases(client)
  const doc = await databases.getDocument('main', 'posts', body.postId)

  return res.json({ success: true, title: doc.title })
}
```

## Environment Variables

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_server_api_key  # server-side only, never expose
```
