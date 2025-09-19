# Backstage Rundeck Plugin

A Backstage scaffolder backend module that provides actions for executing Rundeck jobs as part of your software templates.

## 🚀 Quick Start (5 minutes)

**Prerequisites**: Backstage instance (version 1.19+), Node.js 18+, yarn

```bash
# 1. Navigate to your Backstage root directory
cd your-backstage-app

# 2. Clone plugin into plugins workspace
git clone https://github.com/justynroberts/backstage-rundeck-plugin.git plugins/rundeck

# 3. Install and build the plugin
cd plugins/rundeck
yarn install
yarn build

# 4. Add to backend dependencies
cd ../../packages/backend
# Add this line to package.json dependencies:
# "@internal/plugin-scaffolder-backend-module-rundeck": "workspace:*"

# 5. Register in backend (add to packages/backend/src/index.ts)
# backend.add(import('@internal/plugin-scaffolder-backend-module-rundeck'));

# 6. Configure rundeck in app-config.yaml
# rundeck:
#   url: ${RUNDECK_API_URL}
#   apiToken: ${RUNDECK_API_TOKEN}

# 7. Install dependencies and start
cd ../..
yarn install
yarn start

# ✅ Check logs for: "rundeck:job:execute" in scaffolder actions list
```

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

### Method 1: Workspace Installation (Recommended - Always Works)

This method installs the plugin as a local workspace package, which is the most reliable approach.

```bash
# 1. Navigate to your Backstage app root directory
cd your-backstage-app

# 2. Clone the plugin into the plugins workspace directory
git clone https://github.com/justynroberts/backstage-rundeck-plugin.git plugins/rundeck

# 3. Build the plugin
cd plugins/rundeck
yarn install
yarn build
cd ../..

# 4. Add plugin dependency to backend
# Edit packages/backend/package.json and add to dependencies:
{
  "dependencies": {
    "@internal/plugin-scaffolder-backend-module-rundeck": "workspace:*"
  }
}

# 5. Register the plugin module in packages/backend/src/index.ts
# Add this line after other scaffolder imports:
backend.add(import('@internal/plugin-scaffolder-backend-module-rundeck'));

# 6. Install dependencies
yarn install

# 7. Add configuration (see Configuration section below)

# 8. Start Backstage
yarn start
```

### Method 2: Direct GitHub Installation (Advanced)

**Note**: This method may fail due to build process complexities. Use Method 1 for guaranteed success.

```bash
# Add to packages/backend/package.json:
yarn add "@internal/plugin-scaffolder-backend-module-rundeck@https://github.com/justynroberts/backstage-rundeck-plugin.git"
```

## Configuration

### 1. Add Rundeck Configuration

Add to your `app-config.yaml`:

```yaml
rundeck:
  url: ${RUNDECK_API_URL}
  apiToken: ${RUNDECK_API_TOKEN}
```

### 2. Set Environment Variables

Create or update `.env` in your Backstage root:

```bash
# Rundeck Configuration
RUNDECK_API_URL=https://your-rundeck-instance.com
RUNDECK_API_TOKEN=your-rundeck-api-token

# For testing without real Rundeck (will cause connection errors but plugin will load):
# RUNDECK_API_URL=https://demo.rundeck.com
# RUNDECK_API_TOKEN=dummy-token-for-testing
```

### 3. Register Backend Module

Edit `packages/backend/src/index.ts` and add:

```typescript
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// ... other backend.add() statements

// Add Rundeck scaffolder actions
backend.add(import('@internal/plugin-scaffolder-backend-module-rundeck'));

backend.start();
```

## ✅ Verification

### 1. Check Plugin Loading

Start your Backstage app and check the backend logs for:

```
Starting scaffolder with the following actions enabled rundeck:job:execute, ...
```

**✅ SUCCESS**: If you see `rundeck:job:execute` in the actions list, the plugin is working!

**❌ FAILURE**: If you don't see it, check the troubleshooting section below.

### 2. Test in Scaffolder

Create a test template with:

```yaml
steps:
  - id: test-rundeck
    name: Test Rundeck Action
    action: rundeck:job:execute
    input:
      jobId: "test-job-id"
      projectName: "test-project"
      parameters:
        environment: "development"
      waitForJob: false
```

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

#### Complete Example Template

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: rundeck-deployment
  title: Deploy Application via Rundeck
  description: Deploy an application using Rundeck automation
spec:
  owner: platform-team
  type: deployment

  parameters:
    - title: Deployment Configuration
      required:
        - environment
        - version
      properties:
        environment:
          title: Environment
          type: string
          enum: ['development', 'staging', 'production']
        version:
          title: Application Version
          type: string
          description: Version to deploy (e.g., v1.2.3)

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

    - id: show-results
      name: Show Deployment Results
      action: debug:log
      input:
        message: |
          🚀 Deployment Complete!

          Status: ${{ steps['deploy-app'].output.status }}
          Rundeck URL: ${{ steps['deploy-app'].output.rundeckUrl }}
          Execution ID: ${{ steps['deploy-app'].output.executionId }}

          📋 Deployment Logs:
          ${{ steps['deploy-app'].output.logs }}

  output:
    links:
      - title: Rundeck Execution
        url: ${{ steps['deploy-app'].output.rundeckUrl }}
      - title: Repository
        url: ${{ steps['publish'].output.remoteUrl }}
```

## Troubleshooting

### Plugin Not Loading

**Symptom**: `rundeck:job:execute` not in scaffolder actions list

**Solutions**:

1. **Verify workspace setup**:
   ```bash
   # Check that plugin is in plugins directory
   ls plugins/rundeck/package.json

   # Verify workspace dependency
   grep "workspace:" packages/backend/package.json
   ```

2. **Check import statement**:
   ```bash
   # Verify backend registration
   grep "rundeck" packages/backend/src/index.ts
   ```

3. **Rebuild everything**:
   ```bash
   # Clean and rebuild
   yarn clean
   rm -rf node_modules yarn.lock
   yarn install
   cd plugins/rundeck && yarn build && cd ../..
   yarn install
   yarn start
   ```

### Build Errors

**Symptom**: TypeScript compilation errors or missing declaration files

**Solutions**:

1. **Install missing types**:
   ```bash
   cd plugins/rundeck
   yarn add -D @types/jest @types/node
   yarn build
   ```

2. **Check Backstage version compatibility**:
   ```bash
   # Ensure Backstage 1.19+
   grep "@backstage" packages/backend/package.json
   ```

### Dependency Resolution Issues

**Symptom**: `Cannot find package` or workspace resolution errors

**Solutions**:

1. **Force fresh resolution**:
   ```bash
   rm yarn.lock
   yarn install
   ```

2. **Check yarn workspaces**:
   ```bash
   # Verify workspaces configuration in root package.json
   yarn workspaces list
   ```

### Runtime Configuration Issues

**Symptom**: Plugin loads but fails to execute jobs

**Solutions**:

1. **Verify environment variables**:
   ```bash
   # Check .env file exists and has correct values
   cat .env | grep RUNDECK
   ```

2. **Test Rundeck connectivity**:
   ```bash
   # Test API connection manually
   curl -H "X-Rundeck-Auth-Token: $RUNDECK_API_TOKEN" "$RUNDECK_API_URL/api/40/system/info"
   ```

3. **Check app-config.yaml syntax**:
   ```yaml
   rundeck:
     url: ${RUNDECK_API_URL}    # Note: must use ${} syntax
     apiToken: ${RUNDECK_API_TOKEN}
   ```

### Complete Reset Instructions

If all else fails, start fresh:

```bash
# 1. Stop Backstage
# Ctrl+C or kill processes

# 2. Clean everything
yarn clean
rm -rf node_modules yarn.lock plugins/rundeck

# 3. Re-clone and setup
git clone https://github.com/justynroberts/backstage-rundeck-plugin.git plugins/rundeck
cd plugins/rundeck && yarn install && yarn build && cd ../..

# 4. Add dependency to packages/backend/package.json:
# "@internal/plugin-scaffolder-backend-module-rundeck": "workspace:*"

# 5. Add import to packages/backend/src/index.ts:
# backend.add(import('@internal/plugin-scaffolder-backend-module-rundeck'));

# 6. Reinstall and start
yarn install
yarn start

# 7. Verify success: look for "rundeck:job:execute" in logs
```

## Security

- Never commit API tokens to version control
- Use environment variables for sensitive configuration
- Use minimum required permissions for API tokens
- Consider using Backstage's secret management features

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

### Testing Your Changes

1. Make changes to the plugin
2. Run `yarn build` in the plugin directory
3. Restart your Backstage instance
4. Test with a scaffolder template

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