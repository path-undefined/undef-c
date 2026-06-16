import { Token } from "@/types/token";

export type AstNode = {
  type: string,
  children: AstNode[],
  token?: Token,
}
