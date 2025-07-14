import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import fetch from 'node-fetch';
import { z } from 'zod';

interface ActionOptions {
  config: Config;
  logger: LoggerService;
}

export function createRundeckExecuteAction(options: ActionOptions) {
  const { config, logger } = options;

  return createTemplateAction<{
    jobId: string;
    projectName: string;
    parameters?: Record<string, string>;
    waitForJob?: boolean;
    timeout?: number;
  }>({
    id: 'rundeck:job:execute',
    description: 'Executes a Rundeck job with optional parameters and wait for completion',
    schema: {
      input: z.object({
        jobId: z.string().describe('The Rundeck job ID or UUID'),
        projectName: z.string().describe('The Rundeck project name'),
        parameters: z.record(z.string()).optional().describe('Job parameters as key-value pairs'),
        waitForJob: z.boolean().optional().default(false).describe('Wait for job completion before continuing'),
        timeout: z.number().optional().default(300).describe('Timeout in seconds when waiting for job completion'),
      }),
    },
    async handler(ctx) {
      const { jobId, projectName, parameters = {}, waitForJob = false, timeout = 300 } = ctx.input;
      
      try {
        // Get Rundeck configuration from app-config.yaml
        const rundeckUrl = config.getString('rundeck.url');
        const apiToken = config.getString('rundeck.apiToken');
        
        if (!rundeckUrl || !apiToken) {
          throw new Error('Rundeck URL and API token must be configured in app-config.yaml');
        }

        logger.info(`Executing Rundeck job ${jobId} in project ${projectName}`);
        
        // Build the execution request
        const executionData: any = {
          project: projectName,
        };

        // Add options if parameters are provided
        if (Object.keys(parameters).length > 0) {
          executionData.options = parameters;
        }

        // Execute the job
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

        const result = await response.json() as any;
        const executionId = result.id;
        
        logger.info(`Rundeck job execution started with ID: ${executionId}`);
        
        ctx.output('executionId', executionId);
        ctx.output('rundeckUrl', `${rundeckUrl}/project/${projectName}/execution/show/${executionId}`);

        if (waitForJob) {
          logger.info(`Waiting for job execution ${executionId} to complete (timeout: ${timeout}s)`);
          
          const startTime = Date.now();
          let status = 'running';
          
          while (status === 'running' && (Date.now() - startTime) < timeout * 1000) {
            // Wait 5 seconds before checking status
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
              const statusData = await statusResponse.json() as any;
              status = statusData.status;
              logger.info(`Job execution ${executionId} status: ${status}`);
            } else {
              logger.warn(`Failed to check job status: ${statusResponse.status}`);
            }
          }
          
          if (status === 'running') {
            logger.warn(`Job execution ${executionId} timed out after ${timeout} seconds`);
            ctx.output('status', 'timeout');
          } else {
            logger.info(`Job execution ${executionId} completed with status: ${status}`);
            ctx.output('status', status);
            
            if (status === 'failed') {
              throw new Error(`Rundeck job execution failed with status: ${status}`);
            }
          }
        } else {
          ctx.output('status', 'started');
        }

      } catch (error) {
        logger.error(`Error executing Rundeck job: ${error}`);
        throw error;
      }
    },
  });
}