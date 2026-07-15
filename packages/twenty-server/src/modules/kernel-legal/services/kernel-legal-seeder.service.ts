import { Injectable, Logger } from '@nestjs/common';

import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import {
  KERNEL_LEGAL_OBJECTS,
  type LegalObjectDefinition,
} from 'src/modules/kernel-legal/constants/legal-model.constant';
import { KERNEL_LEGAL_RELATIONS } from 'src/modules/kernel-legal/constants/legal-relations.constant';

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

      const existingFieldByName = new Map(
        (object.fields ?? []).map((field) => [field.name, field]),
      );

      await this.reconcileFieldOptions(
        objectDefinition,
        existingFieldByName,
        workspaceId,
      );

      const fieldsToCreate = objectDefinition.fields.filter(
        (field) => !existingFieldByName.has(field.name),
      );

      if (fieldsToCreate.length === 0) {
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

    await this.seedRelations(workspaceId);

    this.logger.log('Kernel Legal data model seeding finished');
  }

  // Los campos SELECT/MULTI_SELECT creados antes de ampliar el enum (p.ej. el
  // status del lead creado a mano en la UI con 2 opciones) se quedan atrás. Aquí
  // se añaden las opciones que falten conservando las existentes y sus ids.
  private async reconcileFieldOptions(
    objectDefinition: LegalObjectDefinition,
    existingFieldByName: Map<string, { id: string; options?: unknown }>,
    workspaceId: string,
  ): Promise<void> {
    for (const field of objectDefinition.fields) {
      const definedOptions = field.options;

      if (!isDefined(definedOptions) || definedOptions.length === 0) {
        continue;
      }

      const existingField = existingFieldByName.get(field.name);

      if (!isDefined(existingField)) {
        continue;
      }

      const existingOptions = (existingField.options ?? []) as {
        id?: string;
        value: string;
        label: string;
        color: string;
        position: number;
      }[];
      const existingValues = new Set(existingOptions.map((o) => o.value));
      const missingOptions = definedOptions.filter(
        (o) => !existingValues.has(o.value),
      );

      if (missingOptions.length === 0) {
        continue;
      }

      const mergedOptions = [
        ...existingOptions.map((o) => ({
          id: o.id,
          value: o.value,
          label: o.label,
          color: o.color,
          position: o.position,
        })),
        ...missingOptions.map((o, index) => ({
          value: o.value,
          label: o.label,
          color: o.color,
          position: existingOptions.length + index,
        })),
      ];

      await this.fieldMetadataService.updateOneField({
        updateFieldInput: {
          id: existingField.id,
          options: mergedOptions,
        } as Parameters<
          FieldMetadataService['updateOneField']
        >[0]['updateFieldInput'],
        workspaceId,
      });

      this.logger.log(
        `Reconciled ${missingOptions.length} option(s) on "${objectDefinition.nameSingular}.${field.name}"`,
      );
    }
  }

  private async seedRelations(workspaceId: string): Promise<void> {
    const involvedObjectNames = new Set<string>();

    for (const relation of KERNEL_LEGAL_RELATIONS) {
      involvedObjectNames.add(relation.sourceObject);
      involvedObjectNames.add(relation.targetObject);
    }

    const objectByName = new Map<
      string,
      { id: string; fieldNames: Set<string> }
    >();

    for (const nameSingular of involvedObjectNames) {
      const object = await this.objectMetadataService.findOneWithinWorkspace(
        workspaceId,
        { where: { nameSingular } },
      );

      if (isDefined(object)) {
        objectByName.set(nameSingular, {
          id: object.id,
          fieldNames: new Set((object.fields ?? []).map((field) => field.name)),
        });
      }
    }

    for (const relation of KERNEL_LEGAL_RELATIONS) {
      const source = objectByName.get(relation.sourceObject);
      const target = objectByName.get(relation.targetObject);

      if (!isDefined(source) || !isDefined(target)) {
        this.logger.warn(
          `Relation ${relation.sourceObject}.${relation.name}: object not found, skipping`,
        );
        continue;
      }

      if (source.fieldNames.has(relation.name)) {
        continue;
      }

      try {
        await this.fieldMetadataService.createOneField({
          createFieldInput: {
            objectMetadataId: source.id,
            type: FieldMetadataType.RELATION,
            name: relation.name,
            label: relation.label,
            icon: relation.icon,
            isNullable: true,
            relationCreationPayload: {
              type: relation.type,
              targetObjectMetadataId: target.id,
              targetFieldLabel: relation.targetFieldLabel,
              targetFieldIcon: relation.targetFieldIcon,
            },
          },
          workspaceId,
        });

        this.logger.log(
          `Created relation ${relation.sourceObject}.${relation.name} -> ${relation.targetObject}`,
        );
      } catch (error) {
        this.logger.error(
          `Relation ${relation.sourceObject}.${relation.name} failed: ${error.message}`,
        );
      }
    }

    this.logger.log('Kernel Legal relations seeding finished');
  }
}
