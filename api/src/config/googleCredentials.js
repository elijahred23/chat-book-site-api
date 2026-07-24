import fs from 'fs';
import path from 'path';
import { env } from './env.js';
import { apiRoot, secretsDir } from './paths.js';

const localCredentialsPath = path.join(secretsDir, 'tts-sa.json');

const parseServiceAccountJson = (rawJson) => {
  if (!rawJson?.trim()) return null;

  let credentials = JSON.parse(rawJson);
  if (typeof credentials === 'string') credentials = JSON.parse(credentials);
  if (!credentials?.client_email || !credentials?.private_key) {
    throw new Error('Google service-account JSON is missing client_email or private_key.');
  }

  return {
    ...credentials,
    private_key: credentials.private_key.replace(/\\n/g, '\n'),
  };
};

export const googleCredentials = (() => {
  try {
    return parseServiceAccountJson(env.ttsServiceAccountJson);
  } catch (error) {
    throw new Error(`Could not parse TTS_SA_JSON: ${error.message}`);
  }
})();

export const googleCredentialsPath = (() => {
  if (googleCredentials) return '';
  if (env.googleApplicationCredentials) {
    return path.isAbsolute(env.googleApplicationCredentials)
      ? env.googleApplicationCredentials
      : path.resolve(apiRoot, env.googleApplicationCredentials);
  }
  return fs.existsSync(localCredentialsPath) ? localCredentialsPath : '';
})();

if (googleCredentialsPath) process.env.GOOGLE_APPLICATION_CREDENTIALS = googleCredentialsPath;

export const googleAuthOptions = (scopes) => ({
  ...(googleCredentials ? { credentials: googleCredentials } : {}),
  ...(googleCredentialsPath ? { keyFile: googleCredentialsPath } : {}),
  ...(scopes ? { scopes } : {}),
});

export const googleClientOptions = () => (
  googleCredentials ? { credentials: googleCredentials } : {}
);

export const hasGoogleCredentials = () => Boolean(
  googleCredentials || googleCredentialsPath || process.env.GOOGLE_APPLICATION_CREDENTIALS
);
