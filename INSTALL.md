# Installation Guide

## Method 1: Install from Git Repository (Recommended)

```bash
yarn add @internal/plugin-scaffolder-backend-module-rundeck@git+https://github.com/justynroberts/backstage-rundeck-plugin.git
```

## Method 2: Install Specific Version/Branch

```bash
# Install specific version
yarn add @internal/plugin-scaffolder-backend-module-rundeck@git+https://github.com/justynroberts/backstage-rundeck-plugin.git#v1.0.0

# Install from specific branch
yarn add @internal/plugin-scaffolder-backend-module-rundeck@git+https://github.com/justynroberts/backstage-rundeck-plugin.git#main
```

## Method 3: Install from Tarball

If you have the distribution tarball:

```bash
yarn add @internal/plugin-scaffolder-backend-module-rundeck@file:./path/to/package.tgz
```

## Backend Configuration

Add the plugin to your Backstage backend in `packages/backend/src/index.ts`:

```typescript
import { createBackend } from '@backstage/backend-defaults';
import scaffolderModuleRundeck from '@internal/plugin-scaffolder-backend-module-rundeck';

const backend = createBackend();

// Add your existing plugins
backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));
backend.add(import('@backstage/plugin-techdocs-backend/alpha'));

// Add the Rundeck plugin
backend.add(scaffolderModuleRundeck);

backend.start();
```

## App Configuration

Add Rundeck configuration to your `app-config.yaml`:

```yaml
rundeck:
  url: https://your-rundeck-instance.com
  apiToken: ${RUNDECK_API_TOKEN}
```

Set the environment variable:

```bash
export RUNDECK_API_TOKEN=your-actual-api-token
```

## Usage in Templates

Create scaffolder templates that use the Rundeck action:

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: deploy-with-rundeck
  title: Deploy Application with Rundeck
  description: Deploy your application using Rundeck
spec:
  owner: platform-team
  type: deployment
  parameters:
    - title: Deployment Details
      required:
        - jobId
        - environment
      properties:
        jobId:
          title: Rundeck Job ID
          type: string
          description: The ID of the Rundeck job to execute
        environment:
          title: Environment
          type: string
          enum: ['dev', 'staging', 'production']
          description: Target environment
        version:
          title: Version
          type: string
          description: Application version to deploy
          default: 'latest'
  steps:
    - id: rundeck-deploy
      name: Deploy via Rundeck
      action: rundeck:job:execute
      input:
        jobId: ${{ parameters.jobId }}
        projectName: deployment-project
        parameters:
          environment: ${{ parameters.environment }}
          version: ${{ parameters.version }}
          component: ${{ parameters.name }}
        waitForJob: true
```

## Verification

1. Restart your Backstage backend
2. Check backend logs for successful plugin loading
3. Navigate to `/create` in your Backstage UI
4. Look for templates using the `rundeck:job:execute` action
5. Test template execution

## Troubleshooting

### Plugin not found
- Verify the package was installed correctly: `yarn list @internal/plugin-scaffolder-backend-module-rundeck`
- Check import statement matches the exact package name
- Ensure you've restarted the backend after adding the plugin

### Rundeck connection issues
- Verify Rundeck URL is accessible from your Backstage backend
- Check API token has proper permissions
- Test token with curl: `curl -H "X-Rundeck-Auth-Token: YOUR_TOKEN" https://your-rundeck.com/api/40/system/info`

### Action not available
- Verify the plugin is properly registered in your backend
- Check backend logs for any plugin loading errors
- Ensure your templates reference the correct action ID: `rundeck:job:execute`

### Update the plugin
```bash
yarn upgrade @internal/plugin-scaffolder-backend-module-rundeck
```