# EasyVocab

This file provides context about the project for AI assistants.

## Project Overview

- **Ecosystem**: Typescript

## Tech Stack

- **Runtime**: node
- **Package Manager**: bun

### Frontend

- Framework: next
- CSS: tailwind
- UI Library: shadcn-ui
- State: zustand

### Backend

- Framework: express
- Validation: zod

### Database

- Database: postgres
- ORM: prisma

### Additional Features

- Email: nodemailer

## Project Structure

```
EasyVocab/
├── apps/
│   ├── web/         # Frontend application
│   └── server/      # Backend API
├── packages/
│   └── db/          # Database schema
```

## Common Commands

- `bun install` - Install dependencies
- `bun dev` - Start development server
- `bun build` - Build for production
- `bun db:push` - Push database schema
- `bun db:studio` - Open database UI

## Maintenance

Keep CLAUDE.md updated when:

- Adding/removing dependencies
- Changing project structure
- Adding new features or services
- Modifying build/dev workflows

AI assistants should suggest updates to this file when they notice relevant changes.
