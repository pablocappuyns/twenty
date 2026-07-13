import { Module } from '@nestjs/common';

import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { SeedLegalModelCommand } from 'src/modules/kernel-legal/commands/seed-legal-model.command';
import { KernelLegalSeederService } from 'src/modules/kernel-legal/services/kernel-legal-seeder.service';

@Module({
  imports: [ObjectMetadataModule, FieldMetadataModule],
  providers: [SeedLegalModelCommand, KernelLegalSeederService],
})
export class KernelLegalCommandModule {}
