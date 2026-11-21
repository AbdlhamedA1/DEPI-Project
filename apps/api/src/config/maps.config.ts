import { registerAs } from '@nestjs/config';

export const mapsConfig = registerAs('maps', () => ({
  apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
}));
