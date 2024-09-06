import { str, num, bool, makeValidator, cleanEnv } from 'envalid';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Custom validator for URL
const url = makeValidator(x => {
    const url = new URL(x);
    return url.toString();
});

// Define your environment variables schema
const env = cleanEnv(process.env, {
    PORT: num({ default: 3000 }),
    REDIS_URL: url(),
    DEBUG: bool({ default: false }),
});

export default env;
