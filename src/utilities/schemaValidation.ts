import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { zenodoDepositionSchema } from './ZenodoDepositionSchema.ts';
import { zenodoFileSchema } from './ZenodoFileSchema.ts';
import { zenodoMetadataSchema } from './ZenodoMetadataSchema.ts';

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
 * @returns True if the metadata is valid, false otherwise
 */
export function validateZenodoMetadata(metadata: any): boolean {
  const isValid = validateMetadata(metadata);
  if (!isValid) {
    throw new Error(JSON.stringify(validateMetadata.errors, null, 2));
  }
  return isValid;
}

const validateDeposition = ajv.compile(zenodoDepositionSchema);
/**
 * Validate Zenodo deposition against the schema
 * @param deposition - Zenodo deposition object to validate
 * @throws {Error} If the deposition does not conform to the Zenodo schema
 * @returns True if the deposition is valid, false otherwise
 */
export function validateZenodoDeposition(deposition: any): boolean {
  const isValid = validateDeposition(deposition);
  if (!isValid) {
    throw new Error(JSON.stringify(validateMetadata.errors, null, 2));
  }
  return isValid;
}

const validateFile = ajv.compile(zenodoFileSchema);
/**
 * Validate Zenodo file against the schema
 * @param file - Zenodo deposition object to validate
 * @throws {Error} If the deposition does not conform to the Zenodo schema
 * @returns True if the deposition is valid, false otherwise
 */
export function validateZenodoFile(file: any): boolean {
  const isValid = validateFile(file);
  if (!isValid) {
    throw new Error(JSON.stringify(validateMetadata.errors, null, 2));
  }
  return isValid;
}
