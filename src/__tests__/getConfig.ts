import dotenv from 'dotenv';

dotenv.config();

/**
 * Gets the Zenodo access token from environment variables.
 * @returns Configuration object containing the Zenodo access token
 */
export function getConfig(): { accessToken?: string } {
  return {
    accessToken: process.env.ACCESS_TOKEN,
  };
}
