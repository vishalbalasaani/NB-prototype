/**
 * NodeBricks Backend Domain Services (Central Entrypoint)
 *
 * ARCHITECTURAL BOUNDARY:
 * - Server-side business logic, calculation engines, and third-party gateways.
 * - Organized into clean domain subdirectories:
 *     - attendance/ : session lifecycle, working day calculations
 *     - marks/      : grading calculations, marks summaries
 *     - reports/    : PDF memo generation, report layouts
 *     - excel/      : spreadsheet parsing and column validation
 *     - whatsapp/   : Meta WhatsApp Cloud API messaging
 *     - auth/       : secure session verification
 */

export * from './attendance/session-service';
export * from './marks/calculation-service';
export * from './reports/report-service';
export * from './excel/excel-service';
export * from './whatsapp/whatsapp-service';
export * from './auth/auth-service';
