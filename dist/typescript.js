"use strict";
/**
 * Generate typescript interface from table schema
 * Created by xiamx on 2016-08-10.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEnumType = exports.generateTableInterface = exports.attachJoinTypes = void 0;
//tslint:disable
var lodash_1 = __importDefault(require("lodash"));
function nameIsReservedKeyword(name) {
    var reservedKeywords = ['string', 'number', 'package', 'public'];
    return reservedKeywords.indexOf(name) !== -1;
}
/**
 * Returns a version of the name that can be used as a symbol name, e.g.
 * 'number' --> 'number_'.
 */
function getSafeSymbolName(name) {
    if (nameIsReservedKeyword(name)) {
        return name + '_';
    }
    else {
        return name;
    }
}
/** Converts snake_case --> CamelCase */
function toCamelCase(name) {
    return name
        .split('_')
        .map(function (word) { return (word ? word[0].toUpperCase() + word.slice(1) : ''); })
        .join('');
}
function quotedArray(xs) {
    return '[' + xs.map(function (x) { return "'".concat(x, "'"); }).join(', ') + ']';
}
function quoteNullable(x) {
    return x === null || x === undefined ? 'null' : "'".concat(x, "'");
}
function quoteForeignKeyMap(x) {
    var colsTs = lodash_1.default.map(x, function (v, k) {
        return "".concat(k, ": { table: '").concat(v.table, "', column: '").concat(v.column, "', $type: null as unknown /* ").concat(v.table, " */ },");
    });
    return '{' + colsTs.join('\n  ') + '}';
}
var JSDOC_TYPE_RE = /@type \{([^}]+)\}/;
function isNonNullish(x) {
    return x !== null && x !== undefined;
}
/**
 * generateTableInterface() leaves some references to be filled in later, when a more complete
 * picture of the schema is available. This fills those references in:
 * 'null as unknown /* users *\/' --> 'null as unknown as Users'.
 */
function attachJoinTypes(tableTs, tableToNames) {
    return tableTs.replace(/(\$type: null as unknown) \/\* ([^*]+) \*\//g, function (match, g1, tableName) {
        var names = tableToNames[tableName];
        return names ? g1 + ' as ' + names.type : match;
    });
}
exports.attachJoinTypes = attachJoinTypes;
/** Returns [Table TypeScript, output variable name, set of TS types to import] */
function generateTableInterface(tableName, tableDefinition, schemaName, options) {
    var selectableMembers = '';
    var columns = [];
    var requiredForInsert = [];
    var typesToImport = new Set();
    for (var _i = 0, _a = Object.keys(tableDefinition.columns); _i < _a.length; _i++) {
        var columnNameRaw = _a[_i];
        var columnName = options.transformColumnName(columnNameRaw), columnDef = tableDefinition.columns[columnNameRaw], comment_1 = columnDef.comment, possiblyOrNull = columnDef.nullable ? ' | null' : '', insertablyOptional = columnDef.nullable || columnDef.hasDefault ? '?' : '', jsdoc_1 = comment_1 ? "/** ".concat(comment_1, " */") : '';
        var tsType = columnDef.tsType;
        if (comment_1) {
            var m = JSDOC_TYPE_RE.exec(comment_1);
            if (m) {
                tsType = m[1].trim();
                typesToImport.add(tsType);
            }
        }
        selectableMembers += "".concat(columnName, ": ").concat(tsType).concat(possiblyOrNull, "; ").concat(jsdoc_1, "\n");
        columns.push(columnName);
        if (!columnDef.nullable && !columnDef.hasDefault) {
            requiredForInsert.push(columnName);
        }
    }
    var prefixWithSchemaNames = options.options.prefixWithSchemaNames;
    var qualifiedTableName = tableName;
    var sqlTableName = tableName;
    if (prefixWithSchemaNames) {
        qualifiedTableName = schemaName + '_' + qualifiedTableName;
        sqlTableName = schemaName + '.' + sqlTableName;
    }
    var tableVarName = getSafeSymbolName(qualifiedTableName); // e.g. schema_table_name
    var camelTableName = toCamelCase(tableVarName); // e.g. SchemaTableName
    var primaryKey = tableDefinition.primaryKey, comment = tableDefinition.comment;
    var foreignKeys = lodash_1.default.pickBy(lodash_1.default.mapValues(tableDefinition.columns, function (c) { return c.foreignKey; }), isNonNullish);
    var jsdoc = comment ? "/** ".concat(comment, " */\n") : '';
    var names = {
        var: tableVarName,
        type: camelTableName,
    };
    return [
        "\n      // Table ".concat(sqlTableName, "\n      ").concat(jsdoc, " export interface ").concat(names.type, " {\n        ").concat(selectableMembers, "}\n      const ").concat(names.var, " = {\n        tableName: '").concat(sqlTableName, "',\n        columns: ").concat(quotedArray(columns), ",\n        requiredForInsert: ").concat(quotedArray(requiredForInsert), ",\n        primaryKey: ").concat(quoteNullable(primaryKey), ",\n        foreignKeys: ").concat(quoteForeignKeyMap(foreignKeys), ",\n        $type: null as unknown as ").concat(names.type, ",\n      } as const;\n  "),
        names,
        typesToImport,
    ];
}
exports.generateTableInterface = generateTableInterface;
function generateEnumType(enumObject, options) {
    var enumString = '';
    for (var enumNameRaw in enumObject) {
        var enumName = options.transformTypeName(enumNameRaw);
        enumString += "export type ".concat(enumName, " = ");
        enumString += enumObject[enumNameRaw]
            .map(function (v) { return "'".concat(v, "'"); })
            .join(' | ');
        enumString += ';\n';
    }
    return enumString;
}
exports.generateEnumType = generateEnumType;
//# sourceMappingURL=typescript.js.map