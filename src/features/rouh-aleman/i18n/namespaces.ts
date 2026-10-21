export const namespaces = [
  'shared',
  'home',
  'flights',
  'hajj',
  'umrah',
  'tourism',
  'hotels',
  'offers',
  'contact',
  'booking',
  'account',
] as const

export type AppNamespace = (typeof namespaces)[number]

