import * as fs from "node:fs"
import { tokenize } from "./tokenizer/tokenizer.js";

const path = process.argv[2];
const content = fs.readFileSync(path, "utf8");

tokenize(content).forEach((token) => {
  console.log(token.type, token.raw)
})
