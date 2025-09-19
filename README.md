# Backstage Rundeck Plugin

A Backstage scaffolder backend module that provides actions for executing Rundeck jobs as part of your software templates.

## Features

- ✅ Execute Rundeck jobs with parameters
- ✅ Optional job completion waiting with timeout
- ✅ **Execution log retrieval** - Get complete job logs when waiting for completion
- ✅ Secure configuration through app-config.yaml
- ✅ Full TypeScript support
- ✅ Comprehensive logging
- ✅ Error handling and status reporting

## Prerequisites

- Backstage instance (version 1.19+)
- Access to a Rundeck instance with API enabled
- Rundeck API token with appropriate permissions
- Node.js 18+ and Yarn

## Installation

### 1. Prepare the Plugin (Required)

**IMPORTANT**: The plugin must be built before installation. Run these commands first:

```bash
# Clone and build the plugin
git clone https://github.com/justynroberts/backstage-rundeck-plugin.git
cd backstage-rundeck-plugin

# Install dependencies and build
yarn install
yarn tsc
yarn build
```

### 2. Add the Plugin Dependency

Add the plugin to your backend package dependencies:

```bash
cd packages/backend
yarn add @internal/plugin-scaffolder-backend-module-rundeck@https://github.com/justynroberts/backstage-rundeck-plugin.git
```

Or manually edit `packages/backend/package.json`:

```json
{
  "dependencies": {
    "@internal/plugin-scaffolder-backend-module-rundeck": "https://github.com/justynroberts/backstage-rundeck-plugin.git"
  }
}
```

**Note**: If you encounter build issues after adding the dependency, try removing yarn.lock and running `yarn install` again to force fresh dependency resolution.

### 3. Register the Plugin Module

Import and register the module in your backend by editing `packages/backend/src/index.ts`:

```typescript
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// ... other backend.add() statements

// Add Rundeck scaffolder actions
backend.add(import('@internal/plugin-scaffolder-backend-module-rundeck'));

backend.start();
```

### 4. Configure Rundeck Connection

Add Rundeck configuration to your `app-config.yaml`:

```yaml
rundeck:
  url: ${RUNDECK_API_URL}
  apiToken: ${RUNDECK_API_TOKEN}
```

### 5. Set Environment Variables

Create a `.env` file in your Backstage root directory:

```bash
# Rundeck Configuration
RUNDECK_API_URL=https://your-rundeck-instance.com
RUNDECK_API_TOKEN=your-rundeck-api-token
```

### 6. Install Dependencies

```bash
yarn install
```

### 7. Build and Start

```bash
yarn start
```

### 8. Verify Installation

Check the backend logs for:

```
[scaffolder] Starting scaffolder with the following actions enabled rundeck:job:execute, ...
```

If the `rundeck:job:execute` action appears in the list, the plugin has been successfully registered and is ready to use in your software templates.

## Usage

### `rundeck:job:execute`

Executes a Rundeck job with optional parameters.

#### Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | string | ✅ | The Rundeck job ID to execute |
| `projectName` | string | ✅ | The Rundeck project name |
| `parameters` | object | ❌ | Job parameters as key-value pairs |
| `waitForJob` | boolean | ❌ | Whether to wait for job completion (default: false) |
| `timeout` | number | ❌ | Timeout in seconds when waiting for job completion (default: 300) |

#### Outputs

| Parameter | Type | Description |
|-----------|------|-------------|
| `executionId` | string | The ID of the executed job |
| `rundeckUrl` | string | Direct link to the job execution in Rundeck |
| `status` | string | Job completion status (when waitForJob: true) |
| `logs` | string | Complete execution logs (when waitForJob: true) |

#### Example

```yaml
steps:
  - id: deploy-app
    name: Deploy Application
    action: rundeck:job:execute
    input:
      jobId: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
      projectName: "my-deployment-project"
      parameters:
        environment: ${{ parameters.environment }}
        version: ${{ parameters.version }}
        component: ${{ parameters.name }}
        region: "us-east-1"
      waitForJob: true
      timeout: 600

  - id: show-logs
    name: Show Execution Logs
    action: debug:log
    input:
      message: |
        Rundeck Job Execution Complete!
        Status: ${{ steps['deploy-app'].output.status }}
        
        View in Rundeck: ${{ steps['deploy-app'].output.rundeckUrl }}
        
        Execution Logs:
        ${{ steps['deploy-app'].output.logs }}
```

## Troubleshooting

### Plugin Not Loading

1. **Ensure plugin is built first**: Follow step 1 to clone and build the plugin before adding to Backstage
2. Check backend logs for import errors
3. Verify the import statement in backend index.ts
4. Run `yarn install` to ensure plugin is downloaded
5. If you see errors about scaffolderActionsExtensionPoint, ensure you're using a compatible Backstage version (1.19+)

### Dependency Resolution Issues

If you see `Cannot find package '@internal/plugin-scaffolder-backend-module-rundeck'` or workspace resolution errors:

```bash
# Remove yarn.lock and reinstall to force fresh resolution
rm yarn.lock
yarn install
```

### Build Errors

If you encounter TypeScript compilation errors during installation:

```bash
# In the plugin directory
yarn add -D @types/jest @types/node
yarn tsc
yarn build
```

### Configuration Issues

1. Verify environment variables are set
2. Check app-config.yaml syntax
3. Test Rundeck connectivity manually

### API Compatibility

This plugin uses the `@backstage/plugin-scaffolder-node/alpha` API. If you encounter compatibility issues with newer Backstage versions, check that the scaffolder actions extension point import is correct.

## Security

- Never commit API tokens to version control
- Use environment variables for sensitive configuration
- Use minimum required permissions for API tokens

## Development

### Prerequisites

- Node.js 18+
- Yarn 1.22+
- Backstage CLI

### Getting Started

```bash
# Clone the repository
git clone https://github.com/justynroberts/backstage-rundeck-plugin.git
cd backstage-rundeck-plugin

# Install dependencies
yarn install

# Build the plugin
yarn build

# Run tests
yarn test

# Run linting
yarn lint
```

### Building

```bash
yarn build
```

### Testing

```bash
yarn test
```

### Linting

```bash
yarn lint
```

## Compatibility

- **Backstage**: 1.19+
- **Node.js**: 18+
- **Rundeck API**: v40+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass: `yarn test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Submit a pull request

## License

Apache-2.0

## Support

- 📋 [Create an issue](https://github.com/justynroberts/backstage-rundeck-plugin/issues)
- 💬 [Backstage Discord](https://discord.gg/backstage-687207715902193673)

## Changelog

### v1.1.1
- **FIXED**: Compatibility issues with Backstage 1.19+ API
- **FIXED**: TypeScript compilation errors in build process
- **FIXED**: Added missing type dependencies (@types/jest, @types/node)
- **IMPROVED**: Updated documentation with troubleshooting section
- **IMPROVED**: Better error handling and build instructions

### v1.1.0
- **NEW**: Execution log retrieval when `waitForJob: true`
- **NEW**: `logs` output containing complete job execution logs
- **NEW**: `rundeckUrl` output with direct link to execution
- **NEW**: `status` output showing job completion status
- **NEW**: `timeout` parameter for configurable wait timeouts
- Enhanced error handling for log retrieval
- Improved JSON and text format log parsing

### v1.0.0
- Initial release
- Basic Rundeck job execution
- Parameter support
- Job status polling
- TypeScript support