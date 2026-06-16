export type TransparentRule = {
  parentIs?: string,
  childrenAre?: string[],
  always?: true,
}

export type AstNodeDefinition = {
  type: string,
  rule: string[][],
  transparentIf?: TransparentRule[],
}
