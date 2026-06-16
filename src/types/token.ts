import { CodePosition } from "@/types/code-position"

export type Token = {
  type: string,
  raw: string,
  start: CodePosition,
  end: CodePosition,
}
