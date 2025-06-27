import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { Logger } from 'cheminfo-types';

import { zenodoDepositionSchema } from './ZenodoDepositionSchema.ts';
import type { ZenodoDeposition } from './ZenodoDepositionSchema.ts';
import { zenodoFileSchema } from './ZenodoFileSchema.ts';
import type { ZenodoFileType } from './ZenodoFileSchema.ts';
import { zenodoMetadataSchema } from './ZenodoMetadataSchema.ts';
import type { ZenodoMetadata } from './ZenodoMetadataSchema.ts';

// eslint-disable-next-line new-cap
const ajv = new Ajv.default({
  allErrors: true,
});
addFormats.default(ajv);

const validateMetadata = ajv.compile(zenodoMetadataSchema);

/**
 * Validate Zenodo metadata against the schema
 * @param metadata - Zenodo metadata object to validate
 * @throws {Error} If the metadata does not conform to the Zenodo schema
 * @returns The validated Zenodo metadata object
 */
export function validateZenodoMetadata(metadata: unknown): ZenodoMetadata {
  const isValid = validateMetadata(metadata);
  if (!isValid) {
    throw new Error(JSON.stringify(validateMetadata.errors, null, 2));
  }
  return metadata as ZenodoMetadata;
}

const validateDeposition = ajv.compile(zenodoDepositionSchema);
/**
 * Validate Zenodo deposition against the schema
 * @param deposition - Zenodo deposition object to validate
 * @param logger - FifoLogger instance for logging
 * @throws {Error} If the deposition does not conform to the Zenodo schema
 * @returns The validated Zenodo deposition object
 */
export function validateZenodoDeposition(
  deposition: unknown,
  logger?: Logger,
): ZenodoDeposition {
  const licenses: string[] =
    zenodoDepositionSchema.properties.metadata.definitions[
      'license-enum'
    ].enum.flat();
  const isValid = validateDeposition(deposition);
  if (!isValid) {
    throw new Error(JSON.stringify(validateMetadata.errors, null, 2));
  }
  const validatedDeposition = deposition as ZenodoDeposition;

  const license =
    typeof validatedDeposition?.metadata?.license === 'string'
      ? validatedDeposition.metadata.license
      : validatedDeposition?.metadata?.license?.id;

  if (!license || !licenses.includes(license)) {
    logger?.warn(
      `Invalid license "${license}". Valid licenses are: ${licenses.join(', ')}`,
    );
  }
  return deposition as ZenodoDeposition;
}

const validateFile = ajv.compile(zenodoFileSchema);
/**
 * Validate Zenodo file against the schema
 * @param file - Zenodo deposition object to validate
 * @throws {Error} If the deposition does not conform to the Zenodo schema
 * @returns The validated Zenodo file object
 */
export function validateZenodoFile(file: unknown): ZenodoFileType {
  const isValid = validateFile(file);
  if (!isValid) {
    throw new Error(JSON.stringify(validateMetadata.errors, null, 2));
  }
  return file as ZenodoFileType;
}
