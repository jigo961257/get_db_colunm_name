// import { executeQuery } from './db'; // Adjust the import path as needed

// interface ColumnInfo {
//   TABLE_NAME: string;
//   COLUMN_NAME: string;
// }

// interface Data {
//     table: string
//     column: string
// }

// async function getAllColumnNames(): Promise<ColumnInfo[]> {
//   const query = `
//     SELECT 
//       TABLE_NAME,
//       COLUMN_NAME
//     FROM 
//       INFORMATION_SCHEMA.COLUMNS
//     WHERE 
//       TABLE_CATALOG = 'CVISDB1'
//     ORDER BY 
//       TABLE_NAME, 
//       ORDINAL_POSITION;
//   `;

//   try {
//     const results = await executeQuery<ColumnInfo>(query);
//     return results;
//   } catch (error) {
//     console.error('Error executing query:', error);
//     throw error;
//   }
// }

// const data: Data[] = []

// // Usage example
// async function main() {
//   try {
//     const columnNames = await getAllColumnNames();
//     console.log('Column names retrieved:');
//     columnNames.forEach(col => {
//     //   console.log(`Table: ${col.TABLE_NAME}, Column: ${col.COLUMN_NAME}`);
//         data.push({
//             table: col.TABLE_NAME,
//             column: col.COLUMN_NAME
//         })
//     });
//     console.log(data);
//   } catch (error) {
//     console.error('An error occurred:', error);
//   }
// }

// main();




import fs from 'fs';
import { executeQuery } from './db'; // Adjust the import path as needed

interface ColumnInfo {
  TABLE_NAME: string;
  COLUMN_NAME: string;
}

interface Data {
  table: string;
  column: string;
}

interface TableColumnMap {
  [tableName: string]: string[];
}

async function getAllColumnNames(): Promise<ColumnInfo[]> {
  const query = `
    SELECT 
      TABLE_NAME,
      COLUMN_NAME
    FROM 
      INFORMATION_SCHEMA.COLUMNS
    WHERE 
      TABLE_CATALOG = 'CVISDB1'
    ORDER BY 
      TABLE_NAME, 
      ORDINAL_POSITION;
  `;

  try {
    const results = await executeQuery<ColumnInfo>(query);
    return results;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

function convertToTableColumnMap(data: Data[]): TableColumnMap {
  const tableColumnMap: TableColumnMap = {};
  data.forEach((item) => {
    if (!tableColumnMap[item.table]) {
      tableColumnMap[item.table] = [];
    }
    tableColumnMap[item.table].push(item.column);
  });
  return tableColumnMap;
}

async function create_json_file() {
  try {
    const columnNames = await getAllColumnNames();
    console.log('Column names retrieved');

    const data: Data[] = columnNames.map(col => ({
      table: col.TABLE_NAME,
      column: col.COLUMN_NAME
    }));

    const tableColumnMap = convertToTableColumnMap(data);

    // Write the result to a JSON file
    fs.writeFileSync('table_columns.json', JSON.stringify(tableColumnMap, null, 2));
    console.log('JSON file created: table_columns.json');

    // Log a sample of the JSON content
    console.log('Sample of the JSON content:');
    console.log(JSON.stringify(Object.fromEntries(Object.entries(tableColumnMap).slice(0, 3)), null, 2));
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// create_json_file();

// get only table 
