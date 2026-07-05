import { google } from 'googleapis';

export const TABS = {
  WORK_SESSIONS: 'WorkSessions',
  INCOME_EXPENSE: 'IncomeExpense',
  TODO_LIST: 'TodoList',
  SETTINGS: 'Settings',
  USERS: 'Users',
};

export const SHEET_SCHEMAS = {
  [TABS.WORK_SESSIONS]: [
    'SessionID',
    'UserEmail',
    'Date',
    'TaskName',
    'StartTime',
    'EndTime',
    'DurationMin',
    'Notes',
    'CreatedAt',
  ],
  [TABS.INCOME_EXPENSE]: [
    'EntryID',
    'UserEmail',
    'Date',
    'Type',
    'Category',
    'Amount',
    'PaymentMethod',
    'Notes',
    'CreatedAt',
  ],
  [TABS.TODO_LIST]: [
    'TaskID',
    'UserEmail',
    'Date',
    'DayLabel',
    'TaskName',
    'Status',
    'CreatedTime',
    'CompletedTime',
  ],
  [TABS.SETTINGS]: ['Key', 'Value'],
  [TABS.USERS]: ['Email', 'Name', 'JoinedDate'],
};

const DEFAULT_SETTINGS = [
  ['Categories', 'Food, Transport, Freelance, Subscriptions, Salary, Study, Bills, Health'],
  ['PaymentMethods', 'Cash, UPI, Card, Bank Transfer'],
  ['TaskPresets', 'DSA, Client Work, YouTube, College, Reading, Exercise'],
];

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

function parseServiceAccount() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing.');
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    return credentials;
  } catch (error) {
    throw new Error(`GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON: ${error.message}`);
  }
}

function createSheetsClient() {
  if (!SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID is missing.');
  }

  const credentials = parseServiceAccount();
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  return google.sheets({ version: 'v4', auth });
}

const sheets = createSheetsClient();
let sheetIdCache = null;

async function loadSheetProperties() {
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties',
  });

  sheetIdCache = {};
  for (const sheet of res.data.sheets || []) {
    sheetIdCache[sheet.properties.title] = sheet.properties.sheetId;
  }

  return sheetIdCache;
}

async function getSheetId(tabName) {
  if (!sheetIdCache) {
    await loadSheetProperties();
  }
  return sheetIdCache[tabName];
}

function headersMatch(actualHeaders, expectedHeaders) {
  return expectedHeaders.every((header, index) => actualHeaders[index] === header);
}

export async function ensureSpreadsheetSchema() {
  const sheetIds = await loadSheetProperties();
  const missingTabs = Object.values(TABS).filter((tabName) => sheetIds[tabName] === undefined);

  if (missingTabs.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: missingTabs.map((tabName) => ({
          addSheet: {
            properties: {
              title: tabName,
            },
          },
        })),
      },
    });
    await loadSheetProperties();
  }

  for (const [tabName, expectedHeaders] of Object.entries(SHEET_SCHEMAS)) {
    const rows = await getRows(tabName);
    const currentHeaders = rows[0] || [];

    if (!headersMatch(currentHeaders, expectedHeaders)) {
      await updateRow(tabName, 1, expectedHeaders);
    }
  }

  const settingsRows = await getRowsAsObjects(TABS.SETTINGS);
  const settingsByKey = new Map(settingsRows.map((row) => [row.Key, row]));

  for (const [key, defaultValue] of DEFAULT_SETTINGS) {
    const existingRow = settingsByKey.get(key);
    if (!existingRow) {
      await appendRow(TABS.SETTINGS, [key, defaultValue]);
    } else if (!existingRow.Value) {
      await updateRow(TABS.SETTINGS, existingRow._rowIndex, [key, defaultValue]);
    }
  }
}

export async function getRows(tabName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: tabName,
  });
  return res.data.values || [];
}

export async function getRowsAsObjects(tabName) {
  const rows = await getRows(tabName);
  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map((row, index) => {
    const obj = { _rowIndex: index + 2 };
    headers.forEach((header, colIndex) => {
      obj[header] = row[colIndex] || '';
    });
    return obj;
  });
}

export async function appendRow(tabName, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });
}

export async function updateRow(tabName, rowIndex, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });
}

export async function deleteRow(tabName, rowIndex) {
  const sheetId = await getSheetId(tabName);
  if (sheetId === undefined) {
    throw new Error(`Sheet tab "${tabName}" does not exist.`);
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

export async function findRow(tabName, columnName, value) {
  const allRows = await getRowsAsObjects(tabName);
  return allRows.find((row) => row[columnName] === value) || null;
}

export async function findRows(tabName, predicate) {
  const allRows = await getRowsAsObjects(tabName);
  return allRows.filter(predicate);
}
