import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';
import { z } from 'zod';
import fetch from 'node-fetch';

interface RundeckExecutionState {
  completed: boolean;
  executionState: string;
}

interface RundeckExecutionResponse {
  id: string;
}

export const createRundeckExecuteAction = (config: Config) => {
  return createTemplateAction({
    id: 'rundeck:job:execute',
    description: 'Executes a Rundeck job with parameters',
    schema: {
      input: z.object({
        jobId: z.string().describe('The Rundeck job ID to execute'),
        projectName: z.string().describe('The Rundeck project name'),
        parameters: z.record(z.string()).optional().describe('Job parameters as key-value pairs'),
        waitForJob: z.boolean().default(true).describe('Whether to wait for job completion'),
      }),
    },

    async handler(ctx) {
      const { jobId, parameters, waitForJob } = ctx.input;
      const { logger } = ctx;

      try {
        const rundeckUrl = config.getString('rundeck.url');
        const rundeckToken = config.getString('rundeck.apiToken');

        // Debug: Verify config values are present
        logger.debug(`Using Rundeck URL: ${rundeckUrl}`);
        logger.debug('Rundeck token configured: ' + (rundeckToken ? 'Yes' : 'No'));

        if (!rundeckUrl || !rundeckToken) {
          throw new Error('Rundeck URL and API token must be configured');
        }

        const executionId = await executeRundeckJob(rundeckUrl, rundeckToken, jobId, parameters, logger);
        ctx.output('executionId', executionId);

        if (waitForJob) {
          await pollJobStatus(rundeckUrl, rundeckToken, executionId, logger);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`Rundeck job execution failed: ${errorMessage}`);
        throw new Error(`Failed to execute Rundeck job: ${errorMessage}`);
      }
    },
  });
};

async function executeRundeckJob(
  rundeckUrl: string,
  token: string,
  jobId: string,
  parameters?: Record<string, string>,
  logger?: any,
): Promise<string> {
  const url = `${rundeckUrl}/api/40/job/${jobId}/executions`;
  const headers = {
    'X-Rundeck-Auth-Token': token,
    'Content-Type': 'application/json',
  };

  const body = parameters ? { argString: formatParameters(parameters) } : {};

  try {
    logger?.info(`Executing Rundeck job ${jobId}`);
    logger?.debug(`Request URL: ${url}`);
    logger?.debug(`Request headers: ${JSON.stringify(headers)}`);
    logger?.debug(`Request body: ${JSON.stringify(body)}`);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    logger?.debug(`Response status: ${response.status}`);
    logger?.debug(`Response body: ${responseText}`);

    if (!response.ok) {
      throw new Error(`Failed to execute job: ${response.statusText}`);
    }

    const result = JSON.parse(responseText) as RundeckExecutionResponse;
    return result.id;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger?.error(`Rundeck API request failed: ${errorMessage}`);
    throw new Error(`Rundeck API request failed: ${errorMessage}`);
  }
}

async function pollJobStatus(
  rundeckUrl: string,
  token: string,
  executionId: string,
  logger?: any,
): Promise<void> {
  const url = `${rundeckUrl}/api/40/execution/${executionId}/state`;
  const headers = {
    'X-Rundeck-Auth-Token': token,
  };

  while (true) {
    try {
      logger?.info(`Checking status for execution ${executionId}`);
      logger?.debug(`Polling URL: ${url}`);
      logger?.debug(`Request headers: ${JSON.stringify(headers)}`);

      const response = await fetch(url, { headers });
      const responseText = await response.text();
      logger?.debug(`Poll response status: ${response.status}`);
      logger?.debug(`Poll response body: ${responseText}`);

      if (!response.ok) {
        throw new Error(`Failed to get execution status: ${response.statusText}`);
      }

      const status = JSON.parse(responseText) as RundeckExecutionState;
      if (status.completed) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger?.error(`Failed to poll job status: ${errorMessage}`);
      throw new Error(`Failed to poll job status: ${errorMessage}`);
    }
  }
}

function formatParameters(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `-${key} ${value}`)
    .join(' ');
}