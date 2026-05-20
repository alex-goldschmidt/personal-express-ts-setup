const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");

dotenv.config({ path: path.join(rootDir, ".env"), quiet: true });

function toPascalCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toCamelCase(value) {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function parseArgs(argv) {
  const options = {
    controller: false,
    dryRun: false,
    force: false,
    full: false,
    fromDb: false,
    route: false,
    service: false,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--from-db") {
      options.fromDb = true;
      continue;
    }

    if (arg === "--service") {
      options.service = true;
      continue;
    }

    if (arg === "--controller") {
      options.controller = true;
      continue;
    }

    if (arg === "--route") {
      options.route = true;
      continue;
    }

    if (arg === "--full") {
      options.full = true;
      continue;
    }

    if (arg === "--route-path" || arg === "--table" || arg === "--id") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error(`Missing value for ${arg}`);
      }
      const optionName = arg === "--route-path" ? "routePath" : arg.slice(2);
      options[optionName] = nextValue;
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  if (positional.length === 0) {
    throw new Error(
      "Usage: npm run generate:resource -- <resourceName> [--from-db] [--table tableName] [--id fieldName] [--force] [--dry-run]"
    );
  }

  if (positional.length > 1) {
    throw new Error(
      `Unexpected argument(s): ${positional.slice(1).join(", ")}. Use flags like --from-db instead.`
    );
  }

  return {
    resourceName: positional[0],
    ...options,
  };
}

function ensureSafeName(value, label) {
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(value)) {
    throw new Error(
      `${label} must start with a letter and only contain letters, numbers, hyphens, or underscores.`
    );
  }
}

function mapMysqlTypeToTs(column) {
  const type = column.DATA_TYPE.toLowerCase();
  const numericTypes = new Set([
    "bigint",
    "bit",
    "decimal",
    "double",
    "float",
    "int",
    "integer",
    "mediumint",
    "real",
    "smallint",
    "tinyint",
    "year",
  ]);
  const stringTypes = new Set([
    "char",
    "date",
    "datetime",
    "enum",
    "longtext",
    "mediumtext",
    "set",
    "text",
    "time",
    "timestamp",
    "tinytext",
    "varchar",
  ]);

  if (numericTypes.has(type)) return "number";
  if (stringTypes.has(type)) return "string";
  if (type === "json") return "unknown";
  if (type.includes("blob") || type.includes("binary")) return "Buffer";
  return "unknown";
}

function createStaticColumns(idFieldName) {
  return [
    {
      name: idFieldName,
      tsType: "number",
      isNullable: false,
      isPrimary: true,
      isAutoIncrement: true,
    },
  ];
}

async function getColumnsFromDb(tableName) {
  const requiredEnvVars = [
    "MYSQLHOST",
    "MYSQLUSER",
    "MYSQLPASSWORD",
    "MYSQLDATABASE",
  ];
  const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing DB env vars: ${missingEnvVars.join(", ")}`);
  }

  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
  });

  try {
    const [rows] = await connection.execute(
      `SELECT
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        EXTRA,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION`,
      [process.env.MYSQLDATABASE, tableName]
    );

    if (rows.length === 0) {
      throw new Error(
        `Table "${tableName}" was not found in database "${process.env.MYSQLDATABASE}".`
      );
    }

    return rows.map((column) => ({
      name: column.COLUMN_NAME,
      tsType: mapMysqlTypeToTs(column),
      isNullable: column.IS_NULLABLE === "YES",
      isPrimary: column.COLUMN_KEY === "PRI",
      isAutoIncrement: String(column.EXTRA).includes("auto_increment"),
      hasDefault: column.COLUMN_DEFAULT !== null,
      isGenerated: String(column.EXTRA).includes("GENERATED"),
    }));
  } finally {
    await connection.end();
  }
}

function getPrimaryKey(columns, fallbackIdFieldName) {
  return columns.find((column) => column.isPrimary)?.name || fallbackIdFieldName;
}

function rejectLayerScaffoldFlags(args) {
  const layerFlags = [];

  if (args.service) layerFlags.push("--service");
  if (args.controller) layerFlags.push("--controller");
  if (args.route) layerFlags.push("--route");
  if (args.full) layerFlags.push("--full");
  if (args.routePath) layerFlags.push("--route-path");

  if (layerFlags.length === 0) {
    return;
  }

  throw new Error(
    `Repository/service/controller/route scaffolding has been removed from this generator. Unsupported flag(s): ${layerFlags.join(
      ", "
    )}. This script now only generates DB-backed DTO types.`
  );
}

function createDtoContent(names, columns, tableName, generatedAt) {
  const dtoFields = columns
    .map((column) => {
      const nullable = column.isNullable ? " | null" : "";
      return `  ${column.name}: ${column.tsType}${nullable};`;
    })
    .join("\n");
  const header = generatedAt
    ? `// AUTO-GENERATED from MySQL table "${tableName}" at ${generatedAt}.
// Do not edit this file directly. Regenerate it with:
// npm run generate:resource -- ${names.resourceBaseName} --from-db

`
    : "";

  return `${header}import { RowDataPacket } from "mysql2";

export interface ${names.dtoName} extends RowDataPacket {
${dtoFields}
}
`;
}

function createFilesConfig(resourceName, tableName, columns, generatedAt) {
  const resourceBaseName = toCamelCase(resourceName);
  const resourceClassName = toPascalCase(resourceName);
  const names = {
    dtoName: `${resourceClassName}DTO`,
    resourceBaseName,
  };

  return [
    {
      kind: "dto",
      path: path.join(srcDir, "dtos", `${resourceBaseName}.dto.ts`),
      content: createDtoContent(names, columns, tableName, generatedAt),
    },
  ];
}

function writeFileIfNeeded(filePath, content, options) {
  const fileLabel = path.relative(rootDir, filePath);
  const exists = fs.existsSync(filePath);

  if (options.dryRun) {
    const action = exists
      ? options.force || options.overwriteExisting
        ? "overwrite"
        : "skip existing"
      : "write";
    console.log(`[dry-run] ${action} ${fileLabel}`);
    return;
  }

  if (exists && !options.force && !options.overwriteExisting) {
    if (options.skipExisting) {
      console.log(`skipped existing ${fileLabel}`);
      return;
    }

    throw new Error(`Refusing to overwrite existing file: ${fileLabel}`);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`${exists ? "updated" : "created"} ${fileLabel}`);
}

function runBuild() {
  console.log("running npm run build");

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCommand, ["run", "build"], {
    cwd: rootDir,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`npm run build failed with exit code ${result.status}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureSafeName(args.resourceName, "Resource name");
  rejectLayerScaffoldFlags(args);

  const resourceBaseName = toCamelCase(args.resourceName);
  const tableName = args.table || resourceBaseName;
  const fallbackIdFieldName = args.id || `${resourceBaseName}Id`;

  ensureSafeName(tableName, "Table name");
  ensureSafeName(fallbackIdFieldName, "Primary key field name");

  const columns = args.fromDb
    ? await getColumnsFromDb(tableName)
    : createStaticColumns(fallbackIdFieldName);
  const idFieldName = args.id || getPrimaryKey(columns, fallbackIdFieldName);

  if (!columns.some((column) => column.name === idFieldName)) {
    if (args.fromDb) {
      throw new Error(
        `Primary key field "${idFieldName}" was not found on table "${tableName}".`
      );
    }

    columns.unshift({
      name: idFieldName,
      tsType: "number",
      isNullable: false,
      isPrimary: true,
      isAutoIncrement: true,
    });
  }

  const files = createFilesConfig(
    args.resourceName,
    tableName,
    columns,
    args.fromDb ? new Date().toISOString() : null
  );

  for (const file of files) {
    writeFileIfNeeded(file.path, file.content, {
      dryRun: args.dryRun,
      force: args.force,
      overwriteExisting: args.fromDb,
    });
  }

  console.log(
    args.dryRun
      ? "dry run complete"
      : `resource scaffold complete for ${resourceBaseName}`
  );

  if (!args.dryRun) {
    runBuild();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
