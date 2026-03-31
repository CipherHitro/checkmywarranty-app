import { Pool } from 'pg'
import { configDotenv } from 'dotenv'
configDotenv()

export const pool = new Pool({
    connectionString : process.env.PG_URL,
    ssl : {
        rejectUnauthorized : false
    }
})

