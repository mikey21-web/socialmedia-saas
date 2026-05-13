---
name: angular
description: Build apps with Angular (v17+). Use when creating Angular components/services/pipes, using Angular signals, setting up routing with Guards, implementing reactive forms, making HTTP requests with HttpClient, using Angular Material, or building Angular standalone components.
---

# Angular Expert Guide (v17+)

## Project Setup

```bash
npm install -g @angular/cli
ng new my-app --standalone --routing --style=scss
cd my-app && ng serve
```

## Standalone Component (Modern Angular)

```typescript
// user-card.component.ts
import { Component, input, output, signal, computed, effect } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="card" [class.admin]="isAdmin()">
      <h2>{{ user().name }}</h2>
      <p>{{ user().email }}</p>

      @if (isAdmin()) {
        <span class="badge">Admin</span>
      }

      @for (item of items(); track item.id) {
        <li>{{ item.name }}</li>
      }

      <button (click)="onEdit()">Edit</button>
      <a [routerLink]="['/users', user().id]">View Profile</a>
    </div>
  `,
  styles: [`
    .card { padding: 1rem; border-radius: 8px; }
    .admin { border: 2px solid red; }
  `]
})
export class UserCardComponent {
  // Signal inputs (Angular 17+)
  user = input.required<User>()
  items = input<{ id: string; name: string }[]>([])

  // Output events
  edit = output<User>()
  delete = output<string>()

  // Computed signal
  isAdmin = computed(() => this.user().role === 'admin')

  onEdit() {
    this.edit.emit(this.user())
  }
}
```

## Signals (Angular 17+)

```typescript
import { signal, computed, effect } from '@angular/core'

// Writable signal
const count = signal(0)
count()           // read
count.set(5)      // set
count.update(n => n + 1)  // update based on prev

// Computed (auto-tracks dependencies)
const doubled = computed(() => count() * 2)

// Effect (runs on dependency change)
effect(() => {
  console.log('Count changed:', count())
})

// In component
@Component({...})
export class CounterComponent {
  count = signal(0)
  doubled = computed(() => this.count() * 2)

  increment() {
    this.count.update(n => n + 1)
  }
}
```

## Services with HttpClient

```typescript
// users.service.ts
import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'

export interface User {
  id: string
  name: string
  email: string
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient)
  private apiUrl = '/api/users'

  getUsers(search?: string): Observable<User[]> {
    let params = new HttpParams()
    if (search) params = params.set('search', search)

    return this.http.get<User[]>(this.apiUrl, { params })
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`)
  }

  createUser(data: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, data)
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, data)
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
  }
}
```

## Using Services in Components

```typescript
import { Component, inject, signal, OnInit } from '@angular/core'
import { UsersService } from './users.service'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-users',
  standalone: true,
  template: `
    @if (isLoading()) { <p>Loading...</p> }
    @for (user of users(); track user.id) {
      <app-user-card [user]="user" (edit)="onEdit($event)" />
    }
  `,
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService)

  users = signal<User[]>([])
  isLoading = signal(false)

  ngOnInit() {
    this.loadUsers()
  }

  loadUsers() {
    this.isLoading.set(true)
    this.usersService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (err) => console.error(err),
      complete: () => this.isLoading.set(false),
    })
  }

  onEdit(user: User) {
    // handle edit
  }
}
```

## Reactive Forms

```typescript
import { Component, inject } from '@angular/core'
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="name" placeholder="Name" />
      @if (form.get('name')?.errors?.['required'] && form.get('name')?.touched) {
        <p class="error">Name is required</p>
      }

      <input formControlName="email" type="email" placeholder="Email" />
      @if (form.get('email')?.errors?.['email'] && form.get('email')?.touched) {
        <p class="error">Valid email required</p>
      }

      <button type="submit" [disabled]="form.invalid || isSubmitting">
        {{ isSubmitting ? 'Saving...' : 'Save' }}
      </button>
    </form>
  `,
})
export class UserFormComponent {
  private fb = inject(FormBuilder)

  isSubmitting = false

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['user', Validators.required],
  })

  onSubmit() {
    if (this.form.invalid) return
    this.isSubmitting = true
    console.log(this.form.value)
    // call service...
  }
}
```

## Routing

```typescript
// app.routes.ts
import { Routes } from '@angular/router'
import { authGuard } from './guards/auth.guard'

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'users',
    children: [
      { path: '', loadComponent: () => import('./users/users-list.component').then(m => m.UsersListComponent) },
      { path: ':id', loadComponent: () => import('./users/user-detail.component').then(m => m.UserDetailComponent) },
    ],
  },
  { path: 'login', loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) },
  { path: '**', redirectTo: '/dashboard' },
]

// main.ts
import { bootstrapApplication } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { AppComponent } from './app/app.component'
import { routes } from './app/app.routes'
import { authInterceptor } from './app/interceptors/auth.interceptor'

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
})
```

## Route Guard

```typescript
// guards/auth.guard.ts
import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from '../services/auth.service'

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (authService.isLoggedIn()) {
    return true
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  })
}
```

## HTTP Interceptor

```typescript
// interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthService } from '../services/auth.service'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const token = authService.getToken()

  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    })
    return next(authReq)
  }

  return next(req)
}
```

## Pipe

```typescript
// pipes/truncate.pipe.ts
import { Pipe, PipeTransform } from '@angular/core'

@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 100, ellipsis = '...'): string {
    if (value.length <= limit) return value
    return value.substring(0, limit) + ellipsis
  }
}

// Usage in template:
// {{ description | truncate:150 }}
// {{ name | uppercase | truncate:50 }}
```

## Angular Material Setup

```bash
ng add @angular/material
```

```typescript
// Import in component:
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatDialogModule } from '@angular/material/dialog'
import { MatTableModule } from '@angular/material/table'
import { MatSnackBarModule } from '@angular/material/snack-bar'

@Component({
  imports: [MatButtonModule, MatInputModule, MatTableModule],
  template: `
    <mat-form-field>
      <mat-label>Name</mat-label>
      <input matInput formControlName="name" />
    </mat-form-field>
    <button mat-raised-button color="primary" type="submit">Submit</button>
  `
})
```
