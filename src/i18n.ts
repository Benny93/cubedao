// The learner's own language. English is the source text; each other language is a table keyed by that English.
// Chosen in the menu; changing it reloads the page, so word glosses are translated once, as they are made.
import de from './lang/de.ts'
import fr from './lang/fr.ts'
import es from './lang/es.ts'
import ru from './lang/ru.ts'

export const LANGS = ['English', 'Deutsch', 'Français', 'Español', 'Русский']
const TABLES: Record<string, string>[] = [{}, de, fr, es, ru]
/** the save's language option, read here so t() works while the other modules load */
export const langOf = (save: string | null) => { try { const i = JSON.parse(save ?? '{}').opts?.lang; return TABLES[i] ? +i : 0 } catch { return 0 } }
let table = TABLES[langOf(typeof localStorage === 'undefined' ? null : localStorage.getItem('cubedao'))]
export const setLang = (i: number) => { table = TABLES[i] ?? {} } // tests
/** `en` in the learner's language (English when the table has no entry); {0}, {1} … are filled from args */
export const t = (en: string, ...args: (string | number)[]) => (table[en] ?? en).replace(/\{(\d)\}/g, (_, i) => String(args[+i]))
