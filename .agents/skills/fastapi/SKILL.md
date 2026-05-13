---
name: fastapi
description: Build FastAPI REST APIs in Python. Use when creating FastAPI routes/endpoints, implementing request/response models with Pydantic, adding authentication, database integration, background tasks, or deploying FastAPI applications.
---

# FastAPI Expert Guide

## Setup

```bash
pip install fastapi uvicorn[standard] pydantic
# With database:
pip install sqlalchemy asyncpg alembic
# With auth:
pip install python-jose[cryptography] passlib[bcrypt] python-multipart
```

```bash
uvicorn main:app --reload --port 8000
```

## Basic App Structure

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="My API", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from app.routers import users, posts
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
```

## Pydantic Models (Request/Response)

```python
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=150)

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True  # for SQLAlchemy ORM objects

class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if v is not None and len(v.strip()) == 0:
            raise ValueError('name cannot be empty')
        return v
```

## Route Handlers

```python
from fastapi import APIRouter, HTTPException, status, Depends, Query, Path
from typing import List

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    users = await crud.get_users(db, skip=skip, limit=limit, search=search)
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str = Path(..., description="User UUID"),
    db: AsyncSession = Depends(get_db),
):
    user = await crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await crud.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    return await crud.create_user(db, user_in)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_in: UserUpdate, db = Depends(get_db)):
    user = await crud.update_user(db, user_id, user_in)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, db = Depends(get_db)):
    deleted = await crud.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
```

## Dependency Injection

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

# Database session
async def get_db():
    async with SessionLocal() as session:
        yield session

# Current user (from JWT)
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await crud.get_user(db, user_id)
    if user is None:
        raise credentials_exception
    return user

# Use in route
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
```

## JWT Authentication

```python
from datetime import timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/auth/token")
async def login(form: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = await authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token({"sub": str(user.id)}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer"}
```

## Background Tasks

```python
from fastapi import BackgroundTasks

def send_welcome_email(email: str, name: str):
    # runs after response is sent
    email_service.send(email, f"Welcome {name}!")

@router.post("/users/", response_model=UserResponse)
async def create_user(user_in: UserCreate, background_tasks: BackgroundTasks, db = Depends(get_db)):
    user = await crud.create_user(db, user_in)
    background_tasks.add_task(send_welcome_email, user.email, user.name)
    return user
```

## Error Handling

```python
from fastapi import Request
from fastapi.responses import JSONResponse

class AppException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

# Global validation error override
from fastapi.exceptions import RequestValidationError
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )
```

## Testing FastAPI

```python
from fastapi.testclient import TestClient

client = TestClient(app)

def test_create_user():
    response = client.post("/api/users/", json={"email": "a@b.com", "name": "Alice"})
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "a@b.com"

def test_get_nonexistent_user():
    response = client.get("/api/users/nonexistent-id")
    assert response.status_code == 404
```
