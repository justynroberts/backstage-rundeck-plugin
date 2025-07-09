import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createRundeckExecuteAction } from './actions/rundeck/rundeck';
import { coreServices } from '@backstage/backend-plugin-api';

export const scaffolderModule = createBackendModule({
  moduleId: 'rundeck-action',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ scaffolderActions, config }) {
        scaffolderActions.addActions(createRundeckExecuteAction(config));
      }
    });
  },
});
