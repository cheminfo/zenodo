import Ajv from 'ajv';
import addFormats from 'ajv-formats';

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
 * @throws {Error} If the deposition does not conform to the Zenodo schema
 * @returns The validated Zenodo deposition object
 */
export function validateZenodoDeposition(
  deposition: unknown,
): ZenodoDeposition {
  const isValid = validateDeposition(deposition);
  if (!isValid) {
    throw new Error(JSON.stringify(validateMetadata.errors, null, 2));
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
