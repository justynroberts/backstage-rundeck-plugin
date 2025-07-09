# Rundeck Backstage Plugin

A Backstage scaffolder backend module that provides actions for executing Rundeck jobs.

## Features

- Execute Rundeck jobs with parameters
- Wait for job completion with status polling
- Full integration with Backstage scaffolder templates
- Configurable via Backstage app-config.yaml

## Installation

```bash
yarn add git+https://github.com/jroberts/rundeck-backstage.git
```

## Quick Start

1. **Install the plugin**:
   ```bash
   yarn add git+https://github.com/jroberts/rundeck-backstage.git
   ```

2. **Add to your backend** (`packages/backend/src/index.ts`):
   ```typescript
   import { createBackend } from '@backstage/backend-defaults';
   import scaffolderModuleRundeck from '@internal/plugin-scaffolder-backend-module-rundeck';

   const backend = createBackend();
   backend.add(scaffolderModuleRundeck);
   backend.start();
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

## Documentation

- [Installation Guide](./packages/scaffolder-backend-module-rundeck/DISTRIBUTION.md)
- [API Reference](./packages/scaffolder-backend-module-rundeck/README.md)

## Development

```bash
# Install dependencies
yarn install

# Build the plugin
yarn build

# Run tests
yarn test

# Run linting
yarn lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

Apache-2.0

## Support

For issues and questions, please create an issue in this repository.