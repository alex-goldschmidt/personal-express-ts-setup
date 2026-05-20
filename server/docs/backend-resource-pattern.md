# Backend Resource Pattern

This backend currently follows a five-file resource pattern, even when people refer to it as a `route/controller/service` stack.

For each new table-backed resource, create at least:

- `src/repositories/<resource>.repository.ts`
- `src/dtos/<resource>.dto.ts`

If the table also needs HTTP endpoints, add the API layers:

- `src/routes/<resource>.route.ts`
- `src/controllers/<resource>.controller.ts`
- `src/services/<resource>.service.ts`

Typical example already in the repo:

- `practiceone`

## Responsibilities

### Route

- Defines URL paths and HTTP verbs.
- Applies auth/authorization middleware when needed.
- Calls controller handlers.

### Controller

- Reads `params`, `body`, and `query`.
- Builds DTO-shaped input objects.
- Calls service methods.
- Returns responses through `executeSafely`.

### Service

- Holds resource-level business logic.
- Calls the repository layer.
- Returns DTOs or counts/inserted IDs.

### Repository

- Contains SQL queries.
- Uses helpers from `src/config/db.ts`.
- Maps table operations to typed DTO results.

### DTO

- Defines DB-backed row types.
- DTOs usually extend `RowDataPacket`.
- Request models are not generated because API payloads can differ from table schemas. Add request-specific types manually in the appropriate API layer when needed.

## Naming Conventions

- Resource base name: use the same casing as the rest of `src/`.
- Files: `<resource>.<layer>.ts`
- Primary key: default pattern is `<resource>Id`
- Routes in `src/routes/index.ts`: usually plural path names

Examples:

- resource: `organization`
- route file: `organization.route.ts`
- DTO: `OrganizationDTO`
- service class: `OrganizationService`
- repository class: `OrganizationRepository`
- primary key: `organizationId`
- route mount: `/organizations`

## Endpoint Shape

The standard CRUD layout in this repo is:

- `GET /<resources>`
- `GET /<resources>/:<resource>Id`
- `POST /<resources>`
- `PUT /<resources>/:<resource>Id`
- `DELETE /<resources>/:<resource>Id`

Some resources can diverge when auth, nesting, or domain rules require it.

## Scaffold Command

Use the generator for the repetitive boilerplate. By default, it creates the DTO and repository:

```bash
npm run generate:resource -- organization
```

Common options:

```bash
npm run generate:resource -- cool
npm run generate:resource -- cool --from-db
npm run generate:resource -- cool --from-db --table coolTable --id coolId
npm run generate:resource -- cool --service
npm run generate:resource -- cool --service --controller
npm run generate:resource -- cool --service --controller --route --route-path coolThings
npm run generate:resource -- cool --full
```

Example commands for a `projectTask` table:

```bash
# Generate or update only the DTO and repository from the DB table.
npm run generate:resource -- projectTask --from-db

# Preview the DTO and repository generation without writing files.
npm run generate:resource -- projectTask --from-db --dry-run

# Generate DTO, repository, and service.
npm run generate:resource -- projectTask --from-db --service

# Generate DTO, repository, service, and controller.
npm run generate:resource -- projectTask --from-db --service --controller

# Generate DTO, repository, service, controller, route, and route registration.
npm run generate:resource -- projectTask --from-db --service --controller --route

# Generate the route stack with a custom route mount path.
npm run generate:resource -- projectTask --from-db --service --controller --route --route-path projectTasks

# Generate the full stack in one flag.
npm run generate:resource -- projectTask --from-db --full

# Overwrite existing service/controller files too. Use only when intentional.
npm run generate:resource -- projectTask --from-db --full --force

# The generator runs npm run build automatically after writing files.
# Run tests after generation when behavior changed.
npm run test
```

Flags:

- `--service`: also generate `src/services/<resource>.service.ts`
- `--controller`: also generate `src/controllers/<resource>.controller.ts`
- `--route`: also generate `src/routes/<resource>.route.ts` and register it in `src/routes/index.ts`
- `--full`: generate the DTO, repository, service, controller, route, and route registration
- `--route-path <path>`: mount path used in `src/routes/index.ts` when `--route` or `--full` is used
- `--table <tableName>`: SQL table name used in the repository
- `--id <fieldName>`: primary key field name
- `--from-db`: read table columns from the MySQL database configured in `.env`
- `--force`: overwrite generated files if they already exist
- `--dry-run`: print what would be created without writing files

When `--from-db` is used, the generator reads `INFORMATION_SCHEMA.COLUMNS` using the app's `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE` env vars. It uses the detected columns to generate DTO fields, basic `INSERT`/`UPDATE` SQL, and controller body mapping if a controller is generated.

Rerunning `--from-db` updates the generated DTO and repository from the current table schema. If `--route` or `--full` is used, the route file is also updated. Controller and service files are only generated when their flags are used, and existing controller or service files are skipped unless `--force` is used so request handling and resource-specific business logic are preserved. Existing `src/routes/index.ts` registration is left alone if it already exists.

Use `--force` when you intentionally want to overwrite existing files, including the controller and service.

After a successful non-dry-run generation, the script automatically runs `npm run build` so generated `dist/` files are updated immediately. `--dry-run` does not run the build.

## After Generation

The scaffold gives you consistent structure, but you still need to finish the resource:

- Replace placeholder DTO fields and SQL if you did not use `--from-db`.
- Add request-specific models manually if the API payload needs explicit typing.
- If you generated a controller, adjust request mapping for the real payload.
- If you generated a route, add any auth/authorization middleware and review the `src/routes/index.ts` mount path.
- If you generated service/controller behavior, add tests for it.

## Recommended Workflow

1. Add the migration for the new table.
2. Run the scaffold command.
3. Use `--from-db` when possible so the DTO and repository match the real table schema.
4. Add `--service`, `--controller`, `--route`, or `--full` only when the table needs API endpoints.
5. Add middleware, nested route changes, and tests when the generated API layers are used.
