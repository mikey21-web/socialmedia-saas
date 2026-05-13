---
name: nestjs
description: Build NestJS enterprise Node.js applications. Use when creating NestJS modules/controllers/services, implementing dependency injection, guards/interceptors/pipes, working with TypeORM/Prisma in Nest, or building REST/GraphQL APIs with NestJS.
---

# NestJS Expert Guide

## Core Architecture

```
Module → groups related controllers + services
Controller → handles HTTP routes (routes → service calls)
Service → business logic (injectable)
Guard → auth/permissions checks
Pipe → validation/transformation
Interceptor → logging, transformation, caching
```

## Setup

```bash
npm i -g @nestjs/cli
nest new my-app
cd my-app && npm run start:dev
```

## Module Structure

```typescript
// users/users.module.ts
import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],  // allow other modules to use UsersService
})
export class UsersModule {}
```

## Controller

```typescript
import {
  Controller, Get, Post, Put, Delete, Body, Param,
  ParseUUIDPipe, HttpCode, HttpStatus, Query, UseGuards,
  NotFoundException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('limit') limit = 20) {
    return this.usersService.findAll({ search, limit })
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findOne(id)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id)
  }
}
```

## Service

```typescript
import { Injectable, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll(params: { search?: string; limit: number }) {
    return this.prisma.user.findMany({
      where: params.search
        ? { OR: [{ name: { contains: params.search } }, { email: { contains: params.search } }] }
        : undefined,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
    })
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email already registered')
    return this.prisma.user.create({ data: dto })
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: dto })
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } })
  }
}
```

## DTOs with Class Validator

```bash
npm install class-validator class-transformer
```

```typescript
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(1)
  name: string

  @IsString()
  @MinLength(8)
  password: string

  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

```typescript
// main.ts — enable validation globally
import { ValidationPipe } from '@nestjs/common'

app.useGlobalPipes(new ValidationPipe({
  whitelist: true,       // strip unknown fields
  forbidNonWhitelisted: true,  // throw on unknown fields
  transform: true,       // auto-transform types (string → number)
}))
```

## JWT Authentication

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

```typescript
// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    })
  }

  validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email }
    // returned value is attached to req.user
  }
}

// auth/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Use in controller
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user
}
```

## Exception Filters

```typescript
import { Catch, ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: typeof exceptionResponse === 'object'
        ? (exceptionResponse as any).message
        : exceptionResponse,
    })
  }
}
```

## Generate with CLI

```bash
nest g module users
nest g controller users --no-spec
nest g service users --no-spec
nest g resource posts  # full CRUD resource
```
