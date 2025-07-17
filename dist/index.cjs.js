'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var pluginScaffolderNode = require('@backstage/plugin-scaffolder-node');
var backendPluginApi = require('@backstage/backend-plugin-api');

function createRundeckExecuteAction(options) {
  const { config } = options;
  return pluginScaffolderNode.createTemplateAction({
    id: 'rundeck:job:execute',
    description: 'Executes a Rundeck job with optional parameters and wait for completion',
    schema: {
      input: {
        type: 'object',
        required: ['jobId', 'projectName'],
        properties: {
          jobId: {
            type: 'string',
            title: 'Job ID',
            description: 'The Rundeck job ID or UUID',
          },
          projectName: {
            type: 'string',
            title: 'Project Name', 
            description: 'The Rundeck project name',
          },
          parameters: {
            type: 'object',
            title: 'Parameters',
            description: 'Job parameters as key-value pairs',
          },
          waitForJob: {
            type: 'boolean',
            title: 'Wait for Job',
            description: 'Wait for job completion before continuing',
            default: false,
          },
          timeout: {
            type: 'number',
            title: 'Timeout',
            description: 'Timeout in seconds when waiting for job completion',
            default: 300,
          },
        },
      },
    },
    async handler(ctx) {
      const { jobId, projectName, parameters = {}, waitForJob = false, timeout = 300 } = ctx.input;
      
      try {
        const rundeckUrl = config.getString('rundeck.url');
        const apiToken = config.getString('rundeck.apiToken');
        
        if (!rundeckUrl || !apiToken) {
          throw new Error('Rundeck URL and API token must be configured in app-config.yaml');
        }

        const executionData = {
          project: projectName,
        };

        if (Object.keys(parameters).length > 0) {
          executionData.options = parameters;
        }

        const fetch = require('node-fetch');
        const response = await fetch(
          `${rundeckUrl}/api/18/job/${jobId}/executions`,
          {
            method: 'POST',
            headers: {
              'X-Rundeck-Auth-Token': apiToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(executionData),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to execute Rundeck job: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        const executionId = result.id;
        
        ctx.output('executionId', executionId);
        ctx.output('rundeckUrl', `${rundeckUrl}/project/${projectName}/execution/show/${executionId}`);

        if (waitForJob) {
          const startTime = Date.now();
          let status = 'running';
          
          while ((status === 'running' || status === 'scheduled' || status === 'queued') && (Date.now() - startTime) < timeout * 1000) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const statusResponse = await fetch(
              `${rundeckUrl}/api/18/execution/${executionId}`,
              {
                headers: {
                  'X-Rundeck-Auth-Token': apiToken,
                  'Accept': 'application/json',
                },
              }
            );

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              status = statusData.status;
            } else {
              ctx.logger?.warn(`Failed to check job status: ${statusResponse.status}`);
            }
          }
          
          if (status === 'running' || status === 'scheduled' || status === 'queued') {
            ctx.output('status', 'timeout');
          } else {
            ctx.output('status', status);
            
            if (status === 'failed') {
              throw new Error(`Rundeck job execution failed with status: ${status}`);
            }
          }
        } else {
          ctx.output('status', 'started');
        }

      } catch (error) {
        ctx.logger?.error(`Error executing Rundeck job: ${error}`);
        throw error;
      }
    },
  });
}

const rundeckModule = backendPluginApi.createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'rundeck',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: env.services.scaffolder,
        config: env.services.config,
        logger: env.services.logger,
      },
      async init({ scaffolder, config, logger }) {
        const action = createRundeckExecuteAction({ config, logger });
        scaffolder.addActions(action);
      },
    });
  },
});

exports.default = rundeckModule;