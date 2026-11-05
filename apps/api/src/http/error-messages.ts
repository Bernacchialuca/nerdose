import type { ErrorCode, Locale } from '@nerdose/core';

const MESSAGES: Record<Locale, Record<ErrorCode, string>> = {
  es: {
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
  },
  en: {
    no_session: 'No active session.',
    unauthorized: 'Unauthorized.',
    invalid_credentials: 'Invalid credentials.',
    forbidden_origin: 'Origin not allowed.',
    no_challenge_today: 'There is no challenge today.',
    not_found: 'Resource not found.',
    challenge_expired: 'The challenge has expired.',
    challenge_voided: 'The challenge was voided.',
    game_finished: 'The game is already over.',
    already_reported: 'You already reported this challenge.',
    not_voidable: 'The challenge cannot be voided.',
    not_regenerable: 'The challenge cannot be regenerated.',
    not_voided: 'The challenge is not voided.',
    report_not_open: 'The report is not open.',
    unsupported_media_type: 'Unsupported content type.',
    invalid_move: 'Invalid move.',
    not_in_word_list: 'The word is not in the list.',
    invalid_report: 'Invalid report.',
    validation_error: 'Invalid data.',
    rate_limited: 'Too many requests.',
    internal_error: 'Internal server error.',
  },
};

export function errorMessage(code: ErrorCode, locale: Locale): string {
  return MESSAGES[locale][code];
}
