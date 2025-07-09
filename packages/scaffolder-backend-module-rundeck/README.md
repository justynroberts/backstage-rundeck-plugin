# @internal/plugin-scaffolder-backend-module-rundeck

A Backstage scaffolder backend module that provides actions for executing Rundeck jobs.

## Installation

```bash
yarn add @internal/plugin-scaffolder-backend-module-rundeck
```

## Configuration

Add the following to your `app-config.yaml`:

```yaml
rundeck:
  url: https://your-rundeck-instance.com
  apiToken: ${RUNDECK_API_TOKEN}
```

## Usage

### In your backend

```typescript
import { createBackend } from '@backstage/backend-defaults';
import scaffolderModuleRundeck from '@internal/plugin-scaffolder-backend-module-rundeck';

const backend = createBackend();
backend.add(scaffolderModuleRundeck);
```

### In your templates

```yaml
steps:
  - id: execute-rundeck-job
    name: Execute Rundeck Job
    action: rundeck:job:execute
    input:
      jobId: "your-job-id"
      projectName: "your-project-name"
      parameters:
        environment: "production"
        version: "1.0.0"
      waitForJob: true
```

## Action Reference

### `rundeck:job:execute`

Executes a Rundeck job with optional parameters.

#### Inputs

- `jobId` (required): The Rundeck job ID to execute
- `projectName` (required): The Rundeck project name
- `parameters` (optional): Job parameters as key-value pairs
- `waitForJob` (optional, default: true): Whether to wait for job completion

#### Outputs

- `executionId`: The ID of the executed job

## Development

To build the plugin:

```bash
yarn build
```

To run tests:

```bash
yarn test
```
