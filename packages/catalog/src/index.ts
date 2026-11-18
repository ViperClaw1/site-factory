// @repo/catalog: the ecosystem catalog standard (Path-platform-standards, 05-templates/catalog)
// as a TypeScript contract. One format for upload, export and the future shared schema
// (ADR-008, ADR-011); the vendored standard lives in ../standard.
export * from "./types";
export { checkCatalog } from "./validate";
export { csvToDocument, documentToCsv, readCsv, CLEAR, type CsvSource, type CsvConversion, type CsvExport } from "./csv";
export { CATEGORIES, type Category } from "./categories";
export { formatRu, formatReportRu, hasErrors, type Issue, type Rule, type Severity } from "./issues";
