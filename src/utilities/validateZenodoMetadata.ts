import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { zenodoSchema } from './schema';

const ajv = new Ajv();
addFormats(ajv);

const validate = ajv.compile(zenodoSchema);

/**
 * Validate Zenodo metadata against the schema
 * @param metadata - Zenodo metadata object to validate
 * @throws {Error} If the metadata does not conform to the Zenodo schema
 * @returns True if the metadata is valid, false otherwise
 */
export function validateZenodoMetadata(metadata: any): boolean {
  const isValid = validate(metadata);
  if (!isValid) {
    throw new Error(
      `Zenodo metadata validation failed: ${ajv.errorsText(validate.errors, {
        dataVar: 'metadata',
      })}`,
    );
  }
  return isValid;
}
