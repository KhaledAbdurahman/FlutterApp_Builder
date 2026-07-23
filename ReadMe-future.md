# Future README Draft

This file is the temporary planning space for the next architecture. Keep `README.md`
as the current truth until this draft is reviewed, corrected, and ready to replace it.

## Product Context

This codebase is a React and TypeScript frontend for a Flutter drag-and-drop
application builder. The user arranges Flutter widgets visually, edits their
properties, manages screens/projects, and asks the backend to generate Flutter
code or downloadable builds.

The architecture should make the builder easier to grow without turning every
feature into a shared dependency. Think of each page as a workshop bench: tools
used only on that bench stay there, and only tools used across the whole shop
belong on the shared wall.

## Documentation Style

Document the whys, not the obvious hows.

Good documentation should answer questions like:

- Why is this abstraction here?
- Why is this state global instead of page-scoped?
- Why is this API wrapped instead of called directly?
- Why did we duplicate this locally instead of sharing it?
- What constraint would future maintainers miss by only reading the code?

Avoid comments that only restate code. A future maintainer can read what the code
does; documentation should explain the decision behind code that might otherwise
look surprising.

No emojis should be used in the codebase documentation, comments, commit
messages, or UI copy unless there is a specific product requirement.

Analogies are welcome when they make a concept easier to understand, especially
in documentation meant for contributors.

## Architecture

This project will follow a page-centric modular monolith with unidirectional
imports and a modified VSA style that groups related files inside page folders.

The goal is not to split the app into many packages too early. The goal is to
make boundaries clear while the code still lives in one deployable frontend.

## Target Project Structure

```text
src/
├── app/
│   ├── app.tsx
│   └── router/
│       ├── router.tsx
│       └── routes/
│           └── example.route.ts
├── api/                    # Shared API services
├── assets/
├── components/
├── config/
│   └── api/                # API client, base methods, and handlers
│       ├── api-client.ts
│       ├── base-methods.ts
│       └── handlers/
├── hooks/
├── lib/
├── pages/
│   └── example/
│       ├── example-page.tsx
│       ├── components/
│       ├── hooks/
│       ├── stores/
│       ├── types/
│       ├── utils/
│       └── api/
├── stores/
├── types/
├── utils/
├── index.css
└── main.tsx
```

## Page Module Structure

Each page may own its local implementation details:

```text
src/pages/<page-name>/
├── <page-name>-page.tsx
├── components/
├── hooks/
├── stores/
├── types/
├── utils/
└── api/
```

Page folders are allowed to contain duplication when sharing would create a
premature abstraction. Shared code should earn its place by being reused or by
representing a true cross-cutting concern.

## Import Rules

1. Use absolute imports with the `@/` prefix.
2. Do not import from one page module into another page module.
3. Keep imports unidirectional:
   - Shared modules may import from other shared modules.
   - Page modules may import from shared modules.
   - App modules may import from page modules and shared modules.
   - Shared modules must not import from `pages/` or `app/`.
4. Prefer local duplication over premature sharing:
   - Keep helpers, hooks, components, and types local when they are only used by
     one or two places.
   - Promote shared code when it is reused in three or more places, or when it
     represents a true cross-cutting abstraction.
5. Prefer named exports over default exports.

## Naming Rules

All files and folders use kebab-case.

Examples:

- `request-editor.tsx`
- `flow-store.ts`
- `builder-page.tsx`

Naming should be clear and avoid abbreviations.

| Category               | Convention           | Example                              |
| ---------------------- | -------------------- | ------------------------------------ |
| `const` primitives     | SCREAMING_SNAKE_CASE | `const MAX_TIMEOUT = 30000`          |
| `const` objects        | PascalCase           | `const ChooseNotification = { ... }` |
| Object props           | camelCase            | `{ title: "", notificationColor: "" }` |
| Components  TSX/JSX    | PascalCase           | `function WorkspacePage()`           |
| Functions              | camelCase            | `function getWorkspaceDetails()`     |
| Variables (`let`)      | camelCase            | `let currentIndex = 0`               |
| Parameters             | camelCase            | `(requestId: string)`                |
| Types / Interfaces     | PascalCase           | `interface ApiRequest`               |
| API interface fields   | snake_case           | `{ created_at: string }`             |
| Classes                | PascalCase           | `class ExampleWorkFlow`              |

## Enforcement

These rules should be enforced with tooling instead of relying on memory:

- `eslint-plugin-check-file` for file and folder naming.
- A custom architecture ESLint rule or local plugin for import boundaries.
- `@typescript-eslint/naming-convention` for variable naming.
- Husky and lint-staged before commits.
- Prettier before commits.
- Commitlint for commit message rules.

The scripts should be run by Husky.

## Target Tech Stack

| Technology            | Purpose                |
| --------------------- | ---------------------- |
| React 19              | UI framework           |
| TypeScript            | Type safety |
| Vite                  | Build tool and dev server |
| TanStack Router       | Code-based routing |
| Mantine UI            | Prebuilt interface components |
| Mantine Notifications | Toast and notification system |
| Axios                 | HTTP client |
| React Resizable Panels| Resizable builder layout |
| CSS Modules           | Component and page scoped styling |
| CSS variables         | Global tokens for colors, spacing, sizes, borders, and shadows |

## Styling Direction

Tailwind should be replaced with CSS Modules and global CSS variables.

Target styling layers:

- `src/index.css` owns resets, global element styles, and design tokens.
- `*.module.css` files own component and page styling.
- Global tokens should describe meaning instead of raw colors where possible.
- Components should avoid hardcoded values when a token exists.

Example token categories:

- Colors: background, surface, text, muted text, border, accent, danger, success.
- Sizes: panel widths, toolbar heights, canvas dimensions.
- Spacing: page padding, stack gaps, compact control gaps.
- Radius: field radius, panel radius, modal radius.
- Shadows: floating panel shadow, focus ring, drag preview shadow.

## API Direction

The shared API architecture is split between API infrastructure and API
services.

Infrastructure lives in `src/config/api/`:

- `api-client.ts`: Axios client setup, base URL, auth header injection, and
  shared response behavior.
- `base-methods.ts`: High-level `get`, `post`, `put`, and `delete` wrappers.
  The file name can change later if a clearer name appears.
- Handler files: `IHandler`, `IResourceHandler`, `ResourceHandler`, and related
  shared API abstractions.

Services live in `src/api/`.

Page-specific API calls can live inside `src/pages/<page-name>/api/` when they
only belong to one page. The duplication rule is disabled for APIs: if two pages
use the same API, move it to `src/api/` with its tests and interfaces.

Create API endpoint path names as an enum. Then create base methods for all HTTP
methods except PATCH. Updates should always use `PUT`.

Each base method should:

- Accept one object parameter with the necessary props.
- Accept `TResponse` and `TPayload` type arguments so developers stay aware of
  the request and response shape when writing APIs.
- Wrap requests in `try/catch`.
- Use a shared response error handling method in `catch`.

Then implement a repository-like pattern for API services.

API services should extend `ResourceHandler`, which should implement
`IResourceHandler`, which extends `IHandler`.

`IHandler` should only handle the API endpoint. The endpoint should be assigned
through `super()` either by extending `ResourceHandler` or `IHandler` directly.

`IResourceHandler` should mimic the repository interface, including all CRUD
operations: `getAll`, `getById`, `create`, `update`, and `delete`.

`ResourceHandler` should accept type/interface arguments as follows:

- `EndpointResponse`: used for `getAll` and `getById`.
- `EndpointRequest`: used for `POST` and `PUT` when both request bodies match.
- `EndpointUpdateRequest`: used for `PUT` requests when create and update
  request bodies differ.
- `EndpointDetailedResponse`: used for `getById` when the detailed response
  differs from the list response.

`getAll` should return an array of `EndpointResponse`.

Each API group should expose a singleton instance:

```ts
class ComponentService extends ResourceHandler<
  ComponentResponse,
  ComponentRequest,
  ComponentUpdateRequest,
  ComponentDetailedResponse
> {
  constructor() {
    super(ApiEndpointPathNames.COMPONENTS);
  }
}

const COMPONENT_SERVICE = new ComponentService();

export { COMPONENT_SERVICE };
```

Custom API actions should live as public async methods on the service class.

Example:

```ts
class ProjectService extends ResourceHandler<
  ProjectResponse,
  ProjectRequest,
  ProjectUpdateRequest,
  ProjectDetailedResponse
> {
  constructor() {
    super(ApiEndpointPathNames.PROJECTS);
  }

  public async generateFlutterApplication(): Promise<GenerateFlutterResponse> {
    // TODO: Implement after reviewing the final backend behavior.
  }
}
```

Create types for custom actions even when the implementation is left as a TODO
for review. Implement easy custom actions when the backend shape is obvious, but
leave review comments where behavior could be misunderstood.

When implementing services, use TanStack Query and `useSuspenseQuery`. Create a
generic wrapper in the `lib/` folder and use that abstraction for each request.
The wrapper exists so switching from `useSuspenseQuery` to `useQuery`, or moving
away from TanStack Query later, does not force changes through every page.

Wrap places that make HTTP network calls with `Suspense`. Prefer skeleton
fallbacks or a page with a Lottie animation over a basic loader.

### API Testing Direction

API tests should use real endpoints when they are added after each page refactor.

Before running real endpoint tests:

- Assert that the current API base URL includes `localhost` or `127.0.0.1`.
- Use stable test credentials provided for this project.
- Rely on stable seed data provided for the test environment.

Test credentials:

```text
username: string
password: string
```

These are the real stable credentials for the local test environment.

## Notification Direction

Use a notification controller that wraps Mantine notifications behind a small
project-owned API.

The controller should provide success, failure, loader, and loading-state
transitions. The point is to keep product language, positions, colors, and
timings consistent while avoiding direct Mantine calls throughout the app.

Draft shape:

```ts
type NotificationPosition =
  | "top-left"
  | "top-right"
  | "top-center"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

interface NotificationOptions {
  message: string;
  title?: string;
  position?: NotificationPosition;
}

interface LoadingNotificationOptions extends NotificationOptions {
  loadingMessage?: string;
}

const DEFAULT_POSITION: NotificationPosition = "bottom-right";
const DEFAULT_AUTO_CLOSE = 3000;
const DEFAULT_LOADING_MESSAGE = "Please wait...";

export const ChooseNotification = {
  success({
    message,
    title = "Success",
    position = DEFAULT_POSITION,
  }: NotificationOptions): void {
    notifications.show({
      title,
      message,
      color: "green",
      position,
      autoClose: DEFAULT_AUTO_CLOSE,
    });
  },

  failure({
    message,
    title = "Error",
    position = DEFAULT_POSITION,
  }: NotificationOptions): void {
    notifications.show({
      title,
      message,
      color: "red",
      position,
      autoClose: DEFAULT_AUTO_CLOSE + 2000,
    });
  },
};

// write the other props like  loader, loading to success , loading to failure, info, warning
```

## Testing Direction

Testing strategy will be finalized after the architecture restructure.

Current preference:

- Tests should be added at the end of each page refactor.
- API tests should use the real API endpoints.
- API tests should run before commits.

Open testing concerns:

- Real endpoint tests are integration tests, so they need a reliable backend,
  seeded test data, and a stable test environment.
- Pre-commit hooks should stay fast enough that developers do not start avoiding
  them.
- We may still want a small unit-test layer for pure logic such as drag-and-drop
  validation, widget tree utilities, export normalization, and Redux reducers.

## Migration Approach

1. Create this future README draft and agree on the target rules.
2. Upgrade to React 19 first, then resolve package compatibility around that
   version.
3. Inventory current dependencies and decide which packages are removed,
   replaced, or kept.
4. Add tooling foundations:
   - Prettier if missing.
   - ESLint naming rules.
   - File/folder naming enforcement.
   - Import boundary enforcement.
   - Husky, lint-staged, and commitlint.
5. Introduce the target folder structure without changing behavior.
6. Move global builder state from Zustand to Redux.
7. Move routes into `src/app/router` and migrate from React Router to TanStack
   Router.
8. Move builder, auth, dashboard, landing, not-found, error, project-detail, and
   live-preview pages into page modules as they become part of the app.
9. Move shared API behavior into `src/api` and page-specific API calls into page
   folders.
10. Replace shadcn/Radix notification usage with Mantine notification
   controller.
11. Replace Tailwind classes and shadcn UI components with Mantine UI,
   CSS Modules, and CSS variables.
12. Refactor pages page by page, and refactor the editor section by section
   after listing its sections.
13. Add tests at the end of each page refactor.
14. Update `README.md` only after the implemented project matches the future
   architecture.

## Current Repo Notes

As of this draft:

- The current README still describes React 18, Tailwind, shadcn UI, Zustand, and
  React Router.
- `@/` absolute imports are already configured in `tsconfig.app.json`.
- Current routing lives in `src/App.tsx` with `react-router-dom`.
- Current API calls use `fetch` in `src/lib/api.ts`.
- Current global builder state uses Zustand in `src/store/builderStore.ts`.
- Current styling is Tailwind plus global CSS.
- `src/dnd/validateDrop.test.ts` already exists, so the project has at least one
  test surface started.

## Open Decisions

- Which packages are required by the final builder experience, and which are
  template leftovers?
- What backend fixtures, seed data, or test users are required for real endpoint
  API tests?

## Resolved Decisions

- Global state should move from Zustand to Redux.
- React 19 should be the first package migration step because downstream
  packages are sensitive to the React version.
- Mantine should replace Radix/shadcn page by page.
- The editor should be refactored section by section after its sections are
  listed.
- Backend auth uses token headers with `Token` as the prefix.
- API infrastructure should live in `src/config/api/`; API services should live
  in `src/api/`.
- API updates should always use `PUT`, not `PATCH`.
- API list endpoints should return arrays of the response type.
- Custom API actions should live as public async service methods.
- API tests should use real API endpoints and should be added after each page
  refactor.
- Target routes include landing, auth, dashboard, builder, project detail,
  not-found, and probably error and live-preview pages.
