'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var pluginScaffolderNode = require('@backstage/plugin-scaffolder-node');
var fetch = require('node-fetch');
var z = require('zod');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch);

function createRundeckExecuteAction(options) {
  const { config } = options;
  return pluginScaffolderNode.createTemplateAction({
    id: 'rundeck:job:execute',
    description: 'Executes a Rundeck job with optional parameters and wait for completion',
    schema: {
      input: z.z.object({
        jobId: z.z.string().describe('The Rundeck job ID or UUID'),
        projectName: z.z.string().describe('The Rundeck project name'),
        parameters: z.z.record(z.z.string()).optional().describe('Job parameters as key-value pairs'),
        waitForJob: z.z.boolean().optional().default(false).describe('Wait for job completion before continuing'),
        timeout: z.z.number().optional().default(300).describe('Timeout in seconds when waiting for job completion'),
      }),
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

        const response = await fetch__default['default'](
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
            
            const statusResponse = await fetch__default['default'](
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
            
            try {
              let logResponse = await fetch__default['default'](
                `${rundeckUrl}/api/18/execution/${executionId}/output?format=json`,
                {
                  headers: {
                    'X-Rundeck-Auth-Token': apiToken,
                    'Accept': 'application/json',
                  },
                }
              );
              
              let logs = '';
              
              if (logResponse.ok) {
                const logData = await logResponse.json();
                
                if (logData.entries && Array.isArray(logData.entries)) {
                  logs = logData.entries.map((entry) => entry.log || entry.message || entry.content || entry.text).join('\n');
                } else if (logData.output) {
                  logs = logData.output;
                } else if (logData.log) {
                  logs = logData.log;
                } else if (typeof logData === 'string') {
                  logs = logData;
                } else {
                  logs = JSON.stringify(logData, null, 2);
                }
              } else {
                logResponse = await fetch__default['default'](
                  `${rundeckUrl}/api/18/execution/${executionId}/output`,
                  {
                    headers: {
                      'X-Rundeck-Auth-Token': apiToken,
                      'Accept': 'text/plain',
                    },
                  }
                );
                
                if (logResponse.ok) {
                  logs = await logResponse.text();
                }
              }
              
              ctx.output('logs', logs);
              
            } catch (logError) {
              ctx.output('logs', '');
            }
            
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

const rundeckModule = {
  pluginId: 'scaffolder',
  moduleId: 'rundeck',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: env.services.pluginProvider({ pluginId: 'scaffolder' }),
        config: env.services.config,
        logger: env.services.logger,
      },
      async init({ scaffolder, config, logger }) {
        const action = createRundeckExecuteAction({ config, logger });
        scaffolder.registerActions(action);
      },
    });
  },
};

exports.default = rundeckModule;