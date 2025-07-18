import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { Logger } from 'cheminfo-types';
import orcidPkg from 'orcid-utils';

import { zenodoDepositionSchema } from './ZenodoDepositionSchema.ts';
import type { ZenodoDeposition } from './ZenodoDepositionSchema.ts';
import { zenodoFileSchema } from './ZenodoFileSchema.ts';
import type { ZenodoFileType } from './ZenodoFileSchema.ts';
import { zenodoMetadataSchema } from './ZenodoMetadataSchema.ts';
import type { ZenodoMetadata } from './ZenodoMetadataSchema.ts';
import type { ZenodoRecord } from './ZenodoRecordSchema.ts';
import { zenodoRecordSchema } from './ZenodoRecordSchema.ts';
import { ZenodoReviewSchema } from './ZenodoReviewSchema.ts';
import type { ZenodoReview } from './ZenodoReviewSchema.ts';
import { licenseEnum } from './licensesEnum.ts';

const { ORCID } = orcidPkg;

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
  const validatedMetadata: ZenodoMetadata = metadata as ZenodoMetadata;
  if (validatedMetadata.creators) {
    for (const creator of validatedMetadata.creators) {
      if (creator.orcid) {
        validateORCID(creator.orcid);
      }
    }
  }

  return validatedMetadata;
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
  const licenses: string[] = [...licenseEnum.enum];
  const isValid = validateDeposition(deposition);
  if (!isValid) {
    throw new Error(JSON.stringify(validateDeposition.errors, null, 2));
  }
  const validatedDeposition = deposition as ZenodoDeposition | ZenodoRecord;

  const license = validatedDeposition.metadata?.license;

  if (!license) {
    logger?.warn(
      `Invalid license "${license}". Valid licenses are: ${licenses.join(', ')}`,
    );
  }

  if (validatedDeposition?.metadata?.creators) {
    for (const creator of validatedDeposition.metadata.creators) {
      if (creator.orcid) {
        validateORCID(creator.orcid);
      }
    }
  }

  return validatedDeposition;
}

const validateRecord = ajv.compile(zenodoRecordSchema);
/**
 * Validate Zenodo record against the schema
 * @param record - Zenodo record object to validate
 * @throws {Error} If the record does not conform to the Zenodo schema
 * @returns The validated Zenodo record object
 */
export function validateZenodoRecord(record: unknown): ZenodoRecord {
  const isValid = validateRecord(record);
  if (!isValid) {
    throw new Error(JSON.stringify(validateRecord.errors, null, 2));
  }
  return record as ZenodoRecord;
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

const validateRequest = ajv.compile(ZenodoReviewSchema);

/**
 * Validate Zenodo request against the schema
 * @param request - Zenodo request object to validate
 * @throws {Error} If the request does not conform to the Zenodo schema
 * @returns The validated Zenodo request object
 */
export function validateZenodoRequest(request: unknown): ZenodoReview {
  const isValid = validateRequest(request);
  if (!isValid) {
    throw new Error(JSON.stringify(validateRequest.errors, null, 2));
  }
  return request as ZenodoReview;
}

/**
 * This function checks if the provided ORCID ID is valid and returns it in dash format.
 * @param id - ORCID ID to validate
 * @throws {Error} If the ORCID ID is invalid or not provided
 * @returns The ORCID ID in dash format
 */
export function validateORCID(id: string): string {
  if (!id) {
    throw new Error('ORCID is required');
  }
  const isValid = ORCID.isValid(id);
  if (!isValid) {
    throw new Error(`Invalid ORCID: ${id}`);
  }
  return ORCID.toDashFormat(id);
}
