/**
 * Términos fáciles para los primeros `LAUNCH_DAYS` desafíos de Devdle: en ese tramo la palabra del
 * día sale solo de esta lista, mientras quede alguno sin usar. Son más que `LAUNCH_DAYS` para que,
 * con la lista pública, el orden siga siendo impredecible hasta el final del tramo y la rotación de
 * categorías tenga de dónde elegir.
 *
 * Selección de 2026-11-26: los ~120 términos elegibles con más `sitelinks` del banco, filtrados a
 * mano por lo que un dev reconoce sin dudar.
 */
export const LAUNCH_DAYS = 50;

export const DEVDLE_LAUNCH_TERMS: ReadonlySet<string> = new Set([
  // programming_languages
  'PYTHON',
  'JAVASCRIPT',
  'JAVA',
  'RUBY',
  'PERL',
  'PASCAL',
  'BASIC',
  'COBOL',
  'FORTRAN',
  'RUST',
  'KOTLIN',
  'SWIFT',
  'TYPESCRIPT',
  'SCALA',
  'HASKELL',
  'MATLAB',
  'SCRATCH',
  'DART',
  'ELIXIR',
  'POWERSHELL',
  // linux
  'LINUX',
  'UBUNTU',
  'UNIX',
  'MACOS',
  'DEBIAN',
  'FREEBSD',
  'CENTOS',
  'GREP',
  'CHMOD',
  'MKDIR',
  'CHOWN',
  'ECHO',
  // software_engineering
  'HTML',
  'JSON',
  'DOCKER',
  'REACT',
  'KUBERNETES',
  'MARKDOWN',
  'BOOTSTRAP',
  'DJANGO',
  'LARAVEL',
  'FLASK',
  'ANGULAR',
  'QUICKSORT',
  'DEADLOCK',
  'YAML',
  'WEBPACK',
  'FIREBASE',
  'TENSORFLOW',
  'FLUTTER',
  'ASCII',
  'JQUERY',
  'ECLIPSE',
  'FIFO',
  // networking
  'BITCOIN',
  'BLUETOOTH',
  'SAFARI',
  'CHROMIUM',
  'NGINX',
  'TELNET',
  'BITTORRENT',
  'ETHEREUM',
  'WHOIS',
  // security
  'SIGNAL',
  'OPENSSL',
  'WANNACRY',
  'MELTDOWN',
  'SPECTRE',
  // databases
  'MYSQL',
  'POSTGRESQL',
  'MONGODB',
  'SQLITE',
  'REDIS',
  // git
  'GITHUB',
  'GITLAB',
  // apis
  'OPENGL',
  'WEBSOCKET',
]);
