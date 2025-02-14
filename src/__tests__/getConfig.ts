import dotenv from 'dotenv';
dotenv.config();

export function getConfig(): { accessToken?: string } {
  return {
    accessToken: process.env.ACCESS_TOKEN,
  };
}
