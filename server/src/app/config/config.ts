import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    saltRounds: Number(process.env.saltRounds),
    jwt: {
        access_secret: process.env.jwt_access_secret,
        refresh_secret: process.env.jwt_refresh_secret,
        access_expires_in: process.env.jwt_access_expires_in,
        refresh_expires_in: process.env.jwt_refresh_expires_in,
        reset_token: process.env.RESET_TOKEN,
        reset_token_expires_in: process.env.RESET_TOKEN_EXPIRES_IN,
        reset_pass_link: process.env.RESET_PASS_LINK,
    },
};
