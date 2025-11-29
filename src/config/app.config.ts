import { registerAs } from '@nestjs/config';

const port = (process?.env?.PORT || 3000) as string;
export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(port, 10) || 3000,
}));
