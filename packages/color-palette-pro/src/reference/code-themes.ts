export interface ReferenceCodeColors {
  editorBackground: string
  editorForeground: string
  sidebarBackground: string
  comment: string
  keyword: string
  string: string
  definition: string
  type: string
  number: string
  variable: string
  operator: string
  accent: string
  regex: string
}

export interface ReferenceCodeTheme {
  name: string
  isDark: boolean
  colors: ReferenceCodeColors
}

export const REFERENCE_CODE_THEMES: ReferenceCodeTheme[] = [
  // ── Dark ─────────────────────────────────────────────────────────────────
  {
    name: 'VS Code Dark+',
    isDark: true,
    colors: {
      editorBackground: '#1E1E1E',
      editorForeground: '#D4D4D4',
      sidebarBackground: '#252526',
      comment:    '#6A9955',
      keyword:    '#569CD6',
      string:     '#CE9178',
      definition: '#DCDCAA',
      type:       '#4EC9B0',
      number:     '#B5CEA8',
      variable:   '#9CDCFE',
      operator:   '#D4D4D4',
      accent:     '#C586C0',
      regex:      '#D16969',
    },
  },
  {
    name: 'Dracula',
    isDark: true,
    colors: {
      editorBackground: '#282A36',
      editorForeground: '#F8F8F2',
      sidebarBackground: '#21222C',
      comment:    '#6272A4',
      keyword:    '#FF79C6',
      string:     '#F1FA8C',
      definition: '#50FA7B',
      type:       '#8BE9FD',
      number:     '#BD93F9',
      variable:   '#F8F8F2',
      operator:   '#FF79C6',
      accent:     '#BD93F9',
      regex:      '#FF5555',
    },
  },
  {
    name: 'Monokai',
    isDark: true,
    colors: {
      editorBackground: '#272822',
      editorForeground: '#F8F8F2',
      sidebarBackground: '#1E1F1C',
      comment:    '#75715E',
      keyword:    '#F92672',
      string:     '#E6DB74',
      definition: '#A6E22E',
      type:       '#66D9EF',
      number:     '#AE81FF',
      variable:   '#F8F8F2',
      operator:   '#F92672',
      accent:     '#AE81FF',
      regex:      '#E6DB74',
    },
  },
  {
    name: 'Nord',
    isDark: true,
    colors: {
      editorBackground: '#2E3440',
      editorForeground: '#D8DEE9',
      sidebarBackground: '#3B4252',
      comment:    '#4C566A',
      keyword:    '#81A1C1',
      string:     '#A3BE8C',
      definition: '#88C0D0',
      type:       '#8FBCBB',
      number:     '#B48EAD',
      variable:   '#D8DEE9',
      operator:   '#81A1C1',
      accent:     '#EBCB8B',
      regex:      '#EBCB8B',
    },
  },
  // ── Light ────────────────────────────────────────────────────────────────
  {
    name: 'VS Code Light+',
    isDark: false,
    colors: {
      editorBackground: '#FFFFFF',
      editorForeground: '#000000',
      sidebarBackground: '#F3F3F3',
      comment:    '#008000',
      keyword:    '#0000FF',
      string:     '#A31515',
      definition: '#795E26',
      type:       '#267F99',
      number:     '#098658',
      variable:   '#001080',
      operator:   '#000000',
      accent:     '#AF00DB',
      regex:      '#811F3F',
    },
  },
  {
    name: 'GitHub Light',
    isDark: false,
    colors: {
      editorBackground: '#FFFFFF',
      editorForeground: '#24292E',
      sidebarBackground: '#F6F8FA',
      comment:    '#6A737D',
      keyword:    '#D73A49',
      string:     '#032F62',
      definition: '#6F42C1',
      type:       '#6F42C1',
      number:     '#005CC5',
      variable:   '#E36209',
      operator:   '#D73A49',
      accent:     '#005CC5',
      regex:      '#032F62',
    },
  },
  {
    name: 'Solarized Light',
    isDark: false,
    colors: {
      editorBackground: '#FDF6E3',
      editorForeground: '#657B83',
      sidebarBackground: '#EEE8D5',
      comment:    '#93A1A1',
      keyword:    '#859900',
      string:     '#2AA198',
      definition: '#268BD2',
      type:       '#CB4B16',
      number:     '#D33682',
      variable:   '#268BD2',
      operator:   '#657B83',
      accent:     '#6C71C4',
      regex:      '#2AA198',
    },
  },
]
