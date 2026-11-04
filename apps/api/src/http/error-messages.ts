import type { ErrorCode } from '@nerdose/core';

// Transitorio (REQ-001): español fijo hasta que llegue la resolución de locale.
const MESSAGES: Record<ErrorCode, string> = {
  no_session: 'No hay una sesión activa.',
  unauthorized: 'No autorizado.',
  invalid_credentials: 'Credenciales inválidas.',
  forbidden_origin: 'Origen no permitido.',
  no_challenge_today: 'No hay desafío para hoy.',
  not_found: 'Recurso no encontrado.',
  challenge_expired: 'El desafío ya venció.',
  challenge_voided: 'El desafío fue anulado.',
  game_finished: 'La partida ya terminó.',
  already_reported: 'Ya reportaste este desafío.',
  not_voidable: 'El desafío no se puede anular.',
  not_regenerable: 'El desafío no se puede regenerar.',
  not_voided: 'El desafío no está anulado.',
  report_not_open: 'El reporte no está abierto.',
  unsupported_media_type: 'Tipo de contenido no soportado.',
  invalid_move: 'Jugada inválida.',
  not_in_word_list: 'La palabra no está en la lista.',
  invalid_report: 'Reporte inválido.',
  validation_error: 'Datos inválidos.',
  rate_limited: 'Demasiadas solicitudes.',
  internal_error: 'Error interno del servidor.',
};

export function errorMessage(code: ErrorCode): string {
  return MESSAGES[code];
}
