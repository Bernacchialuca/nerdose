import type { TermClass, TimelineClass } from './wikidata';

// QIDs verificados contra Wikidata (wbsearchentities + consulta SPARQL de etiquetas).
export const TERM_CLASSES: readonly TermClass[] = [
  { wikidataClass: 'Q9143', category: 'programming_languages' },
  { wikidataClass: 'Q165194', category: 'apis' },
  { wikidataClass: 'Q557770', category: 'apis' },
  { wikidataClass: 'Q3257930', category: 'git' },
  { wikidataClass: 'Q176165', category: 'databases' },
  { wikidataClass: 'Q3932296', category: 'databases' },
  { wikidataClass: 'Q82231', category: 'databases' },
  { wikidataClass: 'Q15836568', category: 'networking' },
  { wikidataClass: 'Q132364', category: 'networking' },
  { wikidataClass: 'Q1546066', category: 'networking' },
  { wikidataClass: 'Q131669', category: 'linux' },
  { wikidataClass: 'Q18343316', category: 'linux' },
  { wikidataClass: 'Q14663', category: 'linux' },
  { wikidataClass: 'Q14001', category: 'security' },
  { wikidataClass: 'Q4071928', category: 'security' },
  { wikidataClass: 'Q4681865', category: 'security' },
  { wikidataClass: 'Q181156', category: 'software_engineering' },
  { wikidataClass: 'Q271680', category: 'software_engineering' },
  { wikidataClass: 'Q1330336', category: 'software_engineering' },
  { wikidataClass: 'Q2904257', category: 'software_engineering' },
  { wikidataClass: 'Q8366', category: 'software_engineering' },
  { wikidataClass: 'Q175263', category: 'software_engineering' },
  { wikidataClass: 'Q192588', category: 'databases' },
  { wikidataClass: 'Q845739', category: 'databases' },
  { wikidataClass: 'Q6368', category: 'networking' },
  { wikidataClass: 'Q11288', category: 'networking' },
  { wikidataClass: 'Q14656', category: 'linux' },
  { wikidataClass: 'Q183427', category: 'security' },
  { wikidataClass: 'Q5375622', category: 'security' },
  { wikidataClass: 'Q631425', category: 'security' },
  { wikidataClass: 'Q188860', category: 'software_engineering' },
  { wikidataClass: 'Q783866', category: 'software_engineering' },
  { wikidataClass: 'Q13741', category: 'software_engineering' },
  { wikidataClass: 'Q235557', category: 'software_engineering' },
  { wikidataClass: 'Q37045', category: 'software_engineering' },
  { wikidataClass: 'Q1077784', category: 'software_engineering' },
];

// QIDs verificados contra Wikidata (wbsearchentities + consulta SPARQL de etiquetas y conteos).
// Categorías v1 = categorías con clases en este mapeo. No hay mínimo por categoría: entra toda
// categoría con hechos que pasen el filtro de calidad; el mínimo es el total (MIN_APPROVED_TIMELINE_TOTAL).
// El orden importa: un ítem que aparece en dos clases conserva la categoría de la primera.
export const TIMELINE_CLASSES: readonly TimelineClass[] = [
  { wikidataClass: 'Q9143', category: 'programming_languages', dateProperty: 'P571' },
  { wikidataClass: 'Q271680', category: 'frameworks', dateProperty: 'P571' },
  { wikidataClass: 'Q1330336', category: 'frameworks', dateProperty: 'P571' },
  { wikidataClass: 'Q188860', category: 'frameworks', dateProperty: 'P571' },
  { wikidataClass: 'Q1058914', category: 'companies', dateProperty: 'P571' },
  { wikidataClass: 'Q18388277', category: 'companies', dateProperty: 'P571' },
  { wikidataClass: 'Q1137109', category: 'companies', dateProperty: 'P571' },
  { wikidataClass: 'Q9135', category: 'operating_systems', dateProperty: 'P571' },
  { wikidataClass: 'Q920890', category: 'operating_systems', dateProperty: 'P571' },
  {
    wikidataClass: 'Q7889',
    category: 'video_games',
    dateProperty: 'P577',
    fallbackProperty: 'P571',
    // Clase enorme: sin piso propio la consulta da timeout y habría miles de summaries por pedir.
    queryFloor: 30,
  },
  // hardware estuvo diferida con el mínimo por categoría; sin ese mínimo vuelve a entrar. Se usan
  // las clases de modelos (computadora, consola, smartphone): `computer hardware` (Q3966) arrastraba
  // sistemas de archivos y software (ext4, Samba…) que no son hardware.
  {
    wikidataClass: 'Q55990535',
    category: 'hardware',
    dateProperty: 'P577',
    fallbackProperty: 'P571',
  },
  {
    wikidataClass: 'Q56682555',
    category: 'hardware',
    dateProperty: 'P577',
    fallbackProperty: 'P571',
  },
  {
    wikidataClass: 'Q19723451',
    category: 'hardware',
    dateProperty: 'P577',
    fallbackProperty: 'P571',
  },
  // Sistemas de bases de datos (DBMS, relacionales y NoSQL): fecha de creación o, si falta, de publicación.
  {
    wikidataClass: 'Q176165',
    category: 'databases',
    dateProperty: 'P571',
    fallbackProperty: 'P577',
  },
  {
    wikidataClass: 'Q3932296',
    category: 'databases',
    dateProperty: 'P571',
    fallbackProperty: 'P577',
  },
  {
    wikidataClass: 'Q82231',
    category: 'databases',
    dateProperty: 'P571',
    fallbackProperty: 'P577',
  },
  // Software y herramientas: navegadores, editores, IDEs, control de versiones, contenedores.
  {
    wikidataClass: 'Q6368',
    category: 'software_tools',
    dateProperty: 'P571',
    fallbackProperty: 'P577',
  },
  {
    wikidataClass: 'Q131212',
    category: 'software_tools',
    dateProperty: 'P571',
    fallbackProperty: 'P577',
  },
  {
    wikidataClass: 'Q522972',
    category: 'software_tools',
    dateProperty: 'P571',
    fallbackProperty: 'P577',
  },
  {
    wikidataClass: 'Q13741',
    category: 'software_tools',
    dateProperty: 'P571',
    fallbackProperty: 'P577',
  },
  {
    wikidataClass: 'Q3257930',
    category: 'software_tools',
    dateProperty: 'P571',
    fallbackProperty: 'P577',
  },
  {
    wikidataClass: 'Q7935198',
    category: 'software_tools',
    dateProperty: 'P571',
    fallbackProperty: 'P577',
  },
  {
    wikidataClass: 'Q118218718',
    category: 'software_tools',
    dateProperty: 'P571',
    fallbackProperty: 'P577',
  },
];
