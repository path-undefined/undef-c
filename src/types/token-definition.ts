export type TokenDefinition = {
  type: string;
  matcher: string | RegExp;
};

export function isRegExp(m: RegExp | string): m is RegExp {
  return m instanceof RegExp;
}
