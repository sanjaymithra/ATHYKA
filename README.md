# ATHYKA

Scalable platform architecture and monorepo workspace for ATHYKA.

## Repository Structure

```text
ATHYKA/
│
├── frontend/          # Reserved for the public ATHYKA website and client applications
├── backend/           # Reserved for backend services, APIs, authentication, and database integration
├── docs/              # Project planning, architecture decisions, and system specifications
├── .gitignore         # Monorepo ignore rules
├── README.md          # Project overview and development guidelines
└── package.json       # Root workspace orchestration
```

## Directory Guidelines

- **`frontend/`**: Contains the client application and user-facing presentation layers.
- **`backend/`**: Contains server-side services, data layer access, authentication handlers, and API endpoints.
- **`docs/`**: Centralized documentation including Architecture Decision Records (ADRs) and domain specifications.

## Development

Root-level scripts delegate to individual workspaces:

```bash
# Run development servers across workspaces
npm run dev

# Run builds across workspaces
npm run build

# Run linting across workspaces
npm run lint

# Run tests across workspaces
npm run test
```

## Next Steps

1. Select and initialize the client framework inside `frontend/`.
2. Define API protocols, services, and runtime inside `backend/`.
3. Document core architectural choices and schemas in `docs/`.
