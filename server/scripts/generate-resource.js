const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const routesIndexPath = path.join(srcDir, "routes", "index.ts");

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

function pluralize(value) {
  if (value.endsWith("y") && !/[aeiou]y$/i.test(value)) {
    return `${value.slice(0, -1)}ies`;
  }

  if (/(s|x|z|ch|sh)$/i.test(value)) {
    return `${value}es`;
  }

  return `${value}s`;
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
      "Usage: npm run generate:resource -- <resourceName> [--from-db] [--service] [--controller] [--route] [--full] [--route-path path] [--table tableName] [--id fieldName] [--force] [--dry-run]"
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

function sqlIdentifier(value) {
  return value;
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

function createRepositoryContent(names, tableName, columns, idFieldName) {
  const insertColumns = columns.filter(
    (column) =>
      column.name !== idFieldName && !column.isAutoIncrement && !column.isGenerated
  );
  const updateColumns = columns.filter(
    (column) => column.name !== idFieldName && !column.isGenerated
  );

  const insertColumnSql = insertColumns
    .map((column) => sqlIdentifier(column.name))
    .join(", ");
  const insertValuesSql = insertColumns.map(() => "?").join(", ");
  const insertParams = insertColumns
    .map((column) => `resource.${column.name}`)
    .join(", ");
  const updateSetSql = updateColumns
    .map((column) => `${sqlIdentifier(column.name)} = ?`)
    .join(", ");
  const updateParams =
    updateColumns.length > 0
      ? updateColumns
          .map((column) => `resource.${column.name}`)
          .concat(`resource.${idFieldName}`)
          .join(", ")
      : `resource.${idFieldName}, resource.${idFieldName}`;
  const insertSql =
    insertColumns.length > 0
      ? `INSERT INTO \${this.tableName} (${insertColumnSql}) VALUES (${insertValuesSql})`
      : `INSERT INTO \${this.tableName} () VALUES ()`;
  const updateSql =
    updateColumns.length > 0
      ? `UPDATE \${this.tableName} SET ${updateSetSql} WHERE ${sqlIdentifier(
          idFieldName
        )} = ?`
      : `/* TODO: add mutable columns */ UPDATE \${this.tableName} SET ${sqlIdentifier(
          idFieldName
        )} = ? WHERE ${sqlIdentifier(idFieldName)} = ?`;

  return `import {
  executeNonQueryAsync,
  insertAsync,
  queryFirstAsync,
  queryListAsync,
} from "../config/db";
import { ${names.dtoName} } from "../dtos/${names.resourceBaseName}.dto";

export class ${names.repositoryName} {
  static readonly tableName = "${tableName}";

  static async ${names.queryManyName}(): Promise<${names.dtoName}[]> {
    return await queryListAsync<${names.dtoName}>(\`SELECT * FROM \${this.tableName}\`);
  }

  static async ${names.queryOneName}(
    ${idFieldName}: number
  ): Promise<${names.dtoName} | null> {
    return await queryFirstAsync<${names.dtoName}>(
      \`SELECT * FROM \${this.tableName} WHERE ${sqlIdentifier(idFieldName)} = ?\`,
      [${idFieldName}]
    );
  }

  static async ${names.createName}(resource: Partial<${names.dtoName}>): Promise<number> {
    return await insertAsync(
      \`${insertSql}\`,
      [${insertParams}]
    );
  }

  static async ${names.updateName}(resource: Partial<${names.dtoName}>): Promise<number> {
    return await executeNonQueryAsync(
      \`${updateSql}\`,
      [${updateParams}]
    );
  }

  static async ${names.deleteName}(${idFieldName}: number): Promise<number> {
    return await executeNonQueryAsync(
      \`DELETE FROM \${this.tableName} WHERE ${sqlIdentifier(idFieldName)} = ?\`,
      [${idFieldName}]
    );
  }
}
`;
}

function createControllerBody(columns, idFieldName, includeId) {
  const bodyColumns = columns.filter((column) => includeId || column.name !== idFieldName);
  return bodyColumns
    .map((column) => {
      if (column.name === idFieldName) {
        return `    ${column.name}: Number(req.params.${idFieldName}),`;
      }

      return `    ${column.name}: req.body.${column.name},`;
    })
    .join("\n");
}

function createFilesConfig(
  resourceName,
  routePath,
  tableName,
  idFieldName,
  columns,
  generatedAt
) {
  const resourceBaseName = toCamelCase(resourceName);
  const resourceClassName = toPascalCase(resourceName);
  const resourcePluralName = pluralize(resourceBaseName);
  const resourcePluralClassName = toPascalCase(resourcePluralName);
  const names = {
    createName: `create${resourceClassName}`,
    deleteName: `delete${resourceClassName}`,
    dtoName: `${resourceClassName}DTO`,
    getManyName: `get${resourcePluralClassName}`,
    getOneName: `get${resourceClassName}By${toPascalCase(idFieldName)}`,
    paramsTypeName: `Get${resourcePluralClassName}Params`,
    queryManyName: `queryAll${resourcePluralClassName}`,
    queryOneName: `queryBy${toPascalCase(idFieldName)}`,
    repositoryName: `${resourceClassName}Repository`,
    resourceBaseName,
    routerName: `${resourceBaseName}Router`,
    serviceGetOneName: `getSingle${resourceClassName}`,
    serviceName: `${resourceClassName}Service`,
    updateName: `update${resourceClassName}`,
  };
  const mountPath = `/${routePath}`;

  return [
    {
      kind: "dto",
      path: path.join(srcDir, "dtos", `${resourceBaseName}.dto.ts`),
      content: createDtoContent(names, columns, tableName, generatedAt),
    },
    {
      kind: "repository",
      path: path.join(srcDir, "repositories", `${resourceBaseName}.repository.ts`),
      content: createRepositoryContent(names, tableName, columns, idFieldName),
    },
    {
      kind: "service",
      path: path.join(srcDir, "services", `${resourceBaseName}.service.ts`),
      content: `import { ${names.dtoName} } from "../dtos/${resourceBaseName}.dto";
import { ${names.repositoryName} } from "../repositories/${resourceBaseName}.repository";

export class ${names.serviceName} {
  static async ${names.getManyName}(): Promise<${names.dtoName}[]> {
    const result = await ${names.repositoryName}.${names.queryManyName}();
    return result;
  }

  static async ${names.serviceGetOneName}(
    ${idFieldName}: number
  ): Promise<${names.dtoName} | null> {
    const result = await ${names.repositoryName}.${names.queryOneName}(${idFieldName});
    return result;
  }

  static async ${names.createName}(resource: Partial<${names.dtoName}>): Promise<number> {
    return await ${names.repositoryName}.${names.createName}(resource);
  }

  static async ${names.updateName}(resource: Partial<${names.dtoName}>): Promise<number> {
    return await ${names.repositoryName}.${names.updateName}(resource);
  }

  static async ${names.deleteName}(${idFieldName}: number): Promise<number> {
    return await ${names.repositoryName}.${names.deleteName}(${idFieldName});
  }
}
`,
    },
    {
      kind: "controller",
      path: path.join(srcDir, "controllers", `${resourceBaseName}.controller.ts`),
      content: `import { RequestHandler } from "express";
import { ${names.dtoName} } from "../dtos/${resourceBaseName}.dto";
import { ${names.serviceName} } from "../services/${resourceBaseName}.service";
import { HttpStatusCode } from "../constants/constants";
import executeSafely from "../utils/executeSafely";

export interface ${names.paramsTypeName} {
  ${idFieldName}: number;
}

export const ${names.getManyName}: RequestHandler<{}, ${names.dtoName}[]> = async (
  _req,
  res,
  next
) => {
  return executeSafely(() => ${names.serviceName}.${names.getManyName}(), res, next);
};

export const ${names.getOneName}: RequestHandler<
  ${names.paramsTypeName},
  ${names.dtoName}
> = async (req, res, next) => {
  return executeSafely(
    () => ${names.serviceName}.${names.serviceGetOneName}(Number(req.params.${idFieldName})),
    res,
    next
  );
};

export const ${names.createName}: RequestHandler<
  {},
  number,
  Partial<${names.dtoName}>
> = async (req, res, next) => {
  const resourceDto: Partial<${names.dtoName}> = {
${createControllerBody(columns, idFieldName, false)}
  };

  return executeSafely(() => ${names.serviceName}.${names.createName}(resourceDto), res, next, {
    successStatus: HttpStatusCode.CREATED,
    onEmpty: {
      status: HttpStatusCode.SERVER_ERROR,
      message: "${resourceClassName} record not created",
    },
  });
};

export const ${names.updateName}: RequestHandler<
  ${names.paramsTypeName},
  number,
  Partial<${names.dtoName}>
> = async (req, res, next) => {
  const updatedResourceRecord: Partial<${names.dtoName}> = {
${createControllerBody(columns, idFieldName, true)}
  };

  return executeSafely(
    () => ${names.serviceName}.${names.updateName}(updatedResourceRecord),
    res,
    next,
    {
      successStatus: HttpStatusCode.SUCCESS,
      onEmpty: {
        status: HttpStatusCode.NOT_FOUND,
        message: "${resourceClassName} record not updated",
      },
    }
  );
};

export const ${names.deleteName}: RequestHandler<${names.paramsTypeName}, number> = async (
  req,
  res,
  next
) => {
  return executeSafely(
    () => ${names.serviceName}.${names.deleteName}(Number(req.params.${idFieldName})),
    res,
    next,
    {
      successStatus: HttpStatusCode.SUCCESS,
      onEmpty: {
        status: HttpStatusCode.NOT_FOUND,
        message: "${resourceClassName} record not deleted",
      },
    }
  );
};
`,
    },
    {
      kind: "route",
      path: path.join(srcDir, "routes", `${resourceBaseName}.route.ts`),
      content: `import { Router } from "express";
import {
  ${names.getManyName},
  ${names.getOneName},
  ${names.createName},
  ${names.updateName},
  ${names.deleteName},
} from "../controllers/${resourceBaseName}.controller";

const ${names.routerName}: Router = Router();

${names.routerName}.get("/", ${names.getManyName});
${names.routerName}.get("/:${idFieldName}", ${names.getOneName});
${names.routerName}.post("/", ${names.createName});
${names.routerName}.put("/:${idFieldName}", ${names.updateName});
${names.routerName}.delete("/:${idFieldName}", ${names.deleteName});

export default ${names.routerName};
`,
      routeRegistration: {
        importLine: `import ${names.routerName} from "./${resourceBaseName}.route";`,
        useLine: `apiRouter.use("${mountPath}", ${names.routerName});`,
      },
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

function updateRoutesIndex(importLine, useLine, force, dryRun, skipExisting) {
  if (!fs.existsSync(routesIndexPath)) {
    throw new Error("src/routes/index.ts was not found.");
  }

  const currentContent = fs.readFileSync(routesIndexPath, "utf8");

  if (currentContent.includes(importLine) || currentContent.includes(useLine)) {
    if (dryRun) {
      console.log("[dry-run] skip src/routes/index.ts; route registration already exists");
      return;
    }

    if (skipExisting && !force) {
      console.log("skipped src/routes/index.ts; route registration already exists");
      return;
    }

    if (!force) {
      throw new Error(
        "src/routes/index.ts already appears to contain this route. Re-run with --force only if you intentionally want to overwrite the generated files."
      );
    }

    console.log("skipped src/routes/index.ts; route registration already exists");
    return;
  }

  const lines = currentContent.split("\n");
  const exportIndex = lines.findIndex((line) => line.startsWith("export default "));
  const routerDeclarationIndex = lines.findIndex((line) =>
    line.includes("let apiRouter: Router = Router();")
  );

  if (exportIndex === -1 || routerDeclarationIndex === -1) {
    throw new Error("Could not locate insertion points in src/routes/index.ts.");
  }

  lines.splice(routerDeclarationIndex, 0, importLine);
  lines.splice(exportIndex + 1, 0, useLine);
  const nextContent = `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;

  if (dryRun) {
    console.log("[dry-run] update src/routes/index.ts");
    return;
  }

  fs.writeFileSync(routesIndexPath, nextContent, "utf8");
  console.log("updated src/routes/index.ts");
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

  const resourceBaseName = toCamelCase(args.resourceName);
  const routePath = args.routePath || pluralize(resourceBaseName);
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
    routePath,
    tableName,
    idFieldName,
    columns,
    args.fromDb ? new Date().toISOString() : null
  );
  const selectedFileKinds = new Set(["dto", "repository"]);

  if (args.full) {
    selectedFileKinds.add("service");
    selectedFileKinds.add("controller");
    selectedFileKinds.add("route");
  } else {
    if (args.service) selectedFileKinds.add("service");
    if (args.controller) selectedFileKinds.add("controller");
    if (args.route) selectedFileKinds.add("route");
  }

  const filesToWrite = files.filter((file) => selectedFileKinds.has(file.kind));

  for (const file of filesToWrite) {
    writeFileIfNeeded(file.path, file.content, {
      dryRun: args.dryRun,
      force: args.force,
      overwriteExisting:
        args.fromDb && file.kind !== "service" && file.kind !== "controller",
      skipExisting:
        args.fromDb && (file.kind === "service" || file.kind === "controller"),
    });
  }

  const routeFile = filesToWrite.find((file) => file.routeRegistration);
  if (routeFile) {
    updateRoutesIndex(
      routeFile.routeRegistration.importLine,
      routeFile.routeRegistration.useLine,
      args.force,
      args.dryRun,
      args.fromDb
    );
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
