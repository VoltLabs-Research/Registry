# @voltlabs/registry

Public package registry backing `registry.voltcloud.dev`. Stores Volt packages (engines, workflows, libs) in Mongo, with tarballs and READMEs in RustFS (S3-compatible).

Identity is owned by `console.voltcloud.dev`; this service verifies JWTs (via JWKS) or introspects PATs against the console.

## Phase 1 scope

Read-only endpoints plus scope management:

| Method | Path                                                  | Auth | Status        |
| ------ | ----------------------------------------------------- | ---- | ------------- |
| GET    | /healthz                                              | -    | implemented   |
| GET    | /packages/:scope/:name                                | -    | implemented   |
| GET    | /packages/:scope/:name/:version                       | -    | implemented   |
| GET    | /packages/:scope/:name/:version/-/:platform.tgz       | -    | 307 redirect  |
| GET    | /-/search?q=&kind=&page=&pageSize=                    | -    | implemented   |
| GET    | /-/whoami                                             | Bearer | proxy       |
| POST   | /-/scopes                                             | Bearer | implemented |
| POST   | /-/scopes/:scope/members                              | Bearer | implemented |
| PUT    | /packages/:scope/:name                                | Bearer | 501 (Phase 2) |
| DELETE | /packages/:scope/:name/:version                       | Bearer | 501 (Phase 2) |
| POST   | /packages/:scope/:name/:version/deprecate             | Bearer | 501 (Phase 2) |

## Local development

```bash
cp .env.example .env
docker compose up -d mongo rustfs rustfs-init
npm install
npm run dev
```

To bring up the full stack:

```bash
docker compose up --build
```

Healthcheck:

```bash
curl http://localhost:8082/healthz
```

Validate the compose file without starting it:

```bash
docker compose config
```

## Sample requests

```bash
curl http://localhost:8082/packages/voltlabs/cluster-analysis
curl http://localhost:8082/packages/voltlabs/cluster-analysis/1.0.0
curl -L http://localhost:8082/packages/voltlabs/cluster-analysis/1.0.0/-/linux-x86_64.tgz
curl 'http://localhost:8082/-/search?q=cluster&kind=engine'
```

Authenticated requests use the bearer token issued by `console.voltcloud.dev`:

```bash
curl -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"name":"acme"}' \
    http://localhost:8082/-/scopes
```

## Importing the legacy index

The legacy server exposed `https://server.voltcloud.dev/plugin-registry/index.json` (also available locally at `/home/rodyherrera/Desktop/dev/Volt/server/static/plugin-registry/index.json`). The importer ingests every (publisher, key, version, platform) tuple, downloads the tarball, verifies its sha256, uploads to RustFS, and persists a Mongo `Version` document.

```bash
# From the remote (default)
npm run migrate:legacy

# From a local file
npm run migrate:legacy -- --source /home/rodyherrera/Desktop/dev/Volt/server/static/plugin-registry/index.json
```

The script is idempotent. Existing RustFS objects are skipped; existing Mongo Version documents have their platforms updated in place.

## Architecture

```
src/
  core/
    config/        env, db, storage, logger, express
    errors/        AppError + subclasses
    http/          asyncHandler, errorHandler, middleware
  modules/
    scope/         identity-managed scopes
    package/       packuments + immutable versions
    search/        Mongo regex search
    download/      RustFS presigned redirects
    identity/      console proxy + whoami
scripts/
  import-legacy-index.ts
openapi/
  registry.yaml
```

Layering follows the same domain / application / infrastructure split as `Volt/server/src/modules/plugin`.

## Environment

See `.env.example`. The most relevant variables:

- `MONGO_URL`
- `RUSTFS_ENDPOINT` (S3 API, e.g. `http://rustfs:9000`)
- `RUSTFS_TARBALL_BUCKET`, `RUSTFS_README_BUCKET`
- `CONSOLE_URL`, `CONSOLE_JWKS_URL`, `CONSOLE_SERVICE_TOKEN`
- `CORS_ORIGINS` (comma-separated allowlist)
- `SYSTEM_ACCOUNT_ID` (the account that owns scopes seeded by the legacy import)
