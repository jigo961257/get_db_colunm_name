import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost', // or 'localhost' if connecting from the same machine
  database: process.env.DB_NAME, // or your specific database name if different
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true
  },
  port: parseInt(process.env.DB_PORT || '1433'), // Default SQL Server port
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;


async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }
  pool = await new sql.ConnectionPool(config).connect();
  pool.on('error', err => {
    console.error('Unexpected error on idle client', err);
    pool = null;
  });
  return pool;
}


export async function executeQuery<T>(query: string, params?: any[]): Promise<T[]> {
  console.log("query -> ", query);

  try {
    const conn = await getConnection();
    const request = conn.request();

    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }

    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error('SQL error', err);
    throw err;
  }
}

export async function executeTransaction(queries: string[], params?: any[][]): Promise<void> {
  const conn = await getConnection();
  const transaction = new sql.Transaction(conn);

  try {
    await transaction.begin();

    for (let i = 0; i < queries.length; i++) {
      const request = new sql.Request(transaction);

      if (params && params[i]) {
        params[i].forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      }

      await request.query(queries[i]);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error('Transaction error', err);
    throw err;
  }
}

export async function executeStoredProcedure<T>(
  procedureName: string,
  params?: { [key: string]: any }
): Promise<T[]> {
  console.log(`Executing stored procedure: ${procedureName}`);

  try {
    const conn = await getConnection();
    const request = conn.request();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.execute(procedureName);
    return result.recordset;
  } catch (err) {
    console.error('Stored procedure error', err);
    throw err;
  }
}

export async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}