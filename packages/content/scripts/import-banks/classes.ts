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
// Categorías v1 = categorías con clases en este mapeo; una categoría diferida se quita de acá.
// `hardware` quedó diferida en la primera corrida (39 approved con Q3966, mínimo 100).
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
];
