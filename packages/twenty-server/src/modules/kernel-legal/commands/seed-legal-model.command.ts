import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { KernelLegalSeederService } from 'src/modules/kernel-legal/services/kernel-legal-seeder.service';

type SeedLegalModelOptions = {
  workspaceId?: string;
};

@Command({
  name: 'kernel:seed-legal-model',
  description: 'Create the Kernel Legal custom objects and fields in a workspace',
})
export class SeedLegalModelCommand extends CommandRunner {
  private readonly logger = new Logger(SeedLegalModelCommand.name);

  constructor(private readonly kernelLegalSeederService: KernelLegalSeederService) {
    super();
  }

  @Option({
    flags: '-w, --workspace-id [workspaceId]',
    description: 'Target workspace id',
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  async run(
    _passedParams: string[],
    options: SeedLegalModelOptions,
  ): Promise<void> {
    if (!isDefined(options.workspaceId)) {
      this.logger.error('Missing required option --workspace-id');

      return;
    }

    try {
      await this.kernelLegalSeederService.seedWorkspace(options.workspaceId);
    } catch (error) {
      this.logger.error(error);
      this.logger.error(error.stack);
    }
  }
}
