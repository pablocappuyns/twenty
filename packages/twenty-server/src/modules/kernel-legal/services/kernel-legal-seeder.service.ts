import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { KERNEL_LEGAL_OBJECTS } from 'src/modules/kernel-legal/constants/legal-model.constant';

@Injectable()
export class KernelLegalSeederService {
  private readonly logger = new Logger(KernelLegalSeederService.name);

  constructor(
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
  ) {}

  async seedWorkspace(workspaceId: string): Promise<void> {
    for (const objectDefinition of KERNEL_LEGAL_OBJECTS) {
      let object = await this.objectMetadataService.findOneWithinWorkspace(
        workspaceId,
        { where: { nameSingular: objectDefinition.nameSingular } },
      );

      if (!isDefined(object)) {
        this.logger.log(`Creating object "${objectDefinition.nameSingular}"`);

        await this.objectMetadataService.createOneObject({
          createObjectInput: {
            nameSingular: objectDefinition.nameSingular,
            namePlural: objectDefinition.namePlural,
            labelSingular: objectDefinition.labelSingular,
            labelPlural: objectDefinition.labelPlural,
            icon: objectDefinition.icon,
            description: objectDefinition.description,
          },
          workspaceId,
        });

        object = await this.objectMetadataService.findOneWithinWorkspace(
          workspaceId,
          { where: { nameSingular: objectDefinition.nameSingular } },
        );
      }

      if (!isDefined(object)) {
        this.logger.warn(
          `Object "${objectDefinition.nameSingular}" could not be resolved, skipping fields`,
        );
        continue;
      }

      const existingFieldNames = new Set(
        (object.fields ?? []).map((field) => field.name),
      );

      const fieldsToCreate = objectDefinition.fields.filter(
        (field) => !existingFieldNames.has(field.name),
      );

      if (fieldsToCreate.length === 0) {
        this.logger.log(
          `Object "${objectDefinition.nameSingular}" already has all fields`,
        );
        continue;
      }

      await this.fieldMetadataService.createManyFields({
        createFieldInputs: fieldsToCreate.map((field) => ({
          objectMetadataId: object.id,
          type: field.type,
          name: field.name,
          label: field.label,
          description: field.description,
          isNullable: field.isNullable ?? true,
          options: field.options?.map((option, index) => ({
            label: option.label,
            value: option.value,
            color: option.color,
            position: index,
          })),
        })),
        workspaceId,
      });

      this.logger.log(
        `Created ${fieldsToCreate.length} field(s) on "${objectDefinition.nameSingular}"`,
      );
    }

    this.logger.log('Kernel Legal data model seeding finished');
  }
}
