# Backstage Rundeck Plugin

A Backstage scaffolder backend module that provides actions for executing Rundeck jobs as part of your software templates.

## Features

- ✅ Execute Rundeck jobs with parameters
- ✅ Optional job completion waiting with timeout
- ✅ Secure configuration through app-config.yaml
- ✅ Full TypeScript support
- ✅ Comprehensive logging
- ✅ Error handling and status reporting

## Installation

```bash
yarn add @internal/plugin-scaffolder-backend-module-rundeck@git+https://github.com/justynroberts/backstage-rundeck-plugin.git
```

## Quick Start

1. **Install the plugin**:
2. 
   ```bash
   yarn add @internal/plugin-scaffolder-backend-module-rundeck@git+https://github.com/justynroberts/backstage-rundeck-plugin.git
   ```

3. **Add to your backend** (`packages/backend/src/index.ts`):
   ```typescript

   import scaffolderModuleRundeck from '@internal/plugin-scaffolder-backend-module-rundeck';

   backend.add(scaffolderModuleRundeck);

   ```

3. **Configure Rundeck** (`app-config.yaml`):
   ```yaml
   rundeck:
     url: https://your-rundeck-instance.com
     apiToken: ${RUNDECK_API_TOKEN}
   ```

4. **Use in templates**:
   ```yaml
   steps:
     - id: deploy
       name: Deploy with Rundeck
       action: rundeck:job:execute
       input:
         jobId: "your-job-id"
         projectName: "your-project"
         parameters:
           environment: "production"
           version: "1.0.0"
   ```

## Action Reference

### `rundeck:job:execute`

Executes a Rundeck job with optional parameters.

#### Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | string | ✅ | The Rundeck job ID to execute |
| `projectName` | string | ✅ | The Rundeck project name |
| `parameters` | object | ❌ | Job parameters as key-value pairs |
| `waitForJob` | boolean | ❌ | Whether to wait for job completion (default: true) |

#### Outputs

| Parameter | Type | Description |
|-----------|------|-------------|
| `executionId` | string | The ID of the executed job |

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
```

## Documentation

- [📖 Installation Guide](./INSTALL.md) - Detailed installation instructions
- [🔧 Distribution Guide](./DISTRIBUTION.md) - How to distribute this plugin
- [📋 API Reference](./README.md) - This document

## Configuration

### Required Configuration

```yaml
rundeck:
  url: https://your-rundeck-instance.com
  apiToken: ${RUNDECK_API_TOKEN}
```

### Environment Variables

```bash
export RUNDECK_API_TOKEN=your-rundeck-api-token
```

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
- 📖 [Read the documentation](./INSTALL.md)
- 💬 [Backstage Discord](https://discord.gg/backstage-687207715902193673)

## Changelog

### v1.0.0
- Initial release
- Basic Rundeck job execution
- Parameter support
- Job status polling
- TypeScript support
