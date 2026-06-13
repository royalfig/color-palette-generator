/**
 * Token-color fixtures for the six "paramount" reference themes that code-mode
 * calibrates against. Hex values are taken from each theme's published source.
 *
 * Roles map onto code-mode's SyntaxColors naming:
 *   keyword / function (=definition) / string / number / type  → loud roles
 *   comment / variable / operator                              → quiet roles
 */

export interface ExemplarTheme {
  name: string
  mode: 'dark' | 'light'
  bg: string
  fg: string
  /** Roles present vary slightly per theme — only well-attested values included. */
  roles: Partial<Record<ExemplarRole, string>>
  /** Which scopes the theme italicizes by default (for reference). */
  italics: string[]
}

export type ExemplarRole =
  | 'keyword'
  | 'function'
  | 'string'
  | 'number'
  | 'type'
  | 'comment'
  | 'variable'
  | 'operator'

export const LOUD_EXEMPLAR_ROLES: ExemplarRole[] = ['keyword', 'function', 'string', 'number', 'type']
export const QUIET_EXEMPLAR_ROLES: ExemplarRole[] = ['comment', 'variable', 'operator']

export const EXEMPLARS: ExemplarTheme[] = [
  {
    name: 'VS Code Dark Modern',
    mode: 'dark',
    bg: '#1F1F1F',
    fg: '#CCCCCC',
    roles: {
      keyword: '#569CD6',
      function: '#DCDCAA',
      string: '#CE9178',
      number: '#B5CEA8',
      type: '#4EC9B0',
      comment: '#6A9955',
      variable: '#9CDCFE',
      operator: '#D4D4D4',
    },
    italics: [],
  },
  {
    name: 'Night Owl',
    mode: 'dark',
    bg: '#011627',
    fg: '#D6DEEB',
    roles: {
      keyword: '#C792EA',
      function: '#82AAFF',
      string: '#ECC48D',
      number: '#F78C6C',
      type: '#FFCB8B',
      comment: '#637777',
      variable: '#D6DEEB',
      operator: '#C792EA',
    },
    italics: ['comment'],
  },
  {
    name: 'Kanagawa Wave',
    mode: 'dark',
    bg: '#1F1F28',
    fg: '#DCD7BA',
    roles: {
      keyword: '#957FB8',
      function: '#7E9CD8',
      string: '#98BB6C',
      number: '#D27E99',
      type: '#7AA89F',
      comment: '#727169',
      variable: '#DCD7BA',
      operator: '#C0A36E',
    },
    italics: ['comment'],
  },
  {
    name: 'Dracula',
    mode: 'dark',
    bg: '#282A36',
    fg: '#F8F8F2',
    roles: {
      keyword: '#FF79C6',
      function: '#50FA7B',
      string: '#F1FA8C',
      number: '#BD93F9',
      type: '#8BE9FD',
      comment: '#6272A4',
      variable: '#F8F8F2',
    },
    italics: [],
  },
  {
    name: 'Nord',
    mode: 'dark',
    bg: '#2E3440',
    fg: '#D8DEE9',
    roles: {
      keyword: '#81A1C1',
      function: '#88C0D0',
      string: '#A3BE8C',
      number: '#B48EAD',
      type: '#8FBCBB',
      comment: '#616E88',
      variable: '#D8DEE9',
      operator: '#81A1C1',
    },
    italics: [],
  },
  {
    name: 'One Dark Pro',
    mode: 'dark',
    bg: '#282C34',
    fg: '#ABB2BF',
    roles: {
      keyword: '#C678DD',
      function: '#61AFEF',
      string: '#98C379',
      number: '#D19A66',
      type: '#E5C07B',
      comment: '#5C6370',
      variable: '#E06C75',
      operator: '#56B6C2',
    },
    italics: ['comment'],
  },
  {
    name: 'One Light',
    mode: 'light',
    bg: '#FAFAFA',
    fg: '#383A42',
    roles: {
      keyword: '#A626A4',
      function: '#4078F2',
      string: '#50A14F',
      number: '#986801',
      type: '#C18401',
      comment: '#A0A1A7',
      variable: '#E45649',
      operator: '#0184BC',
    },
    italics: ['comment'],
  },
]
