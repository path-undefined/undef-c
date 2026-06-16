import { AstNodeDefinition } from "@/types/ast-node-definition"
import { defRelatedRuleDefinitions } from "@/definitions/def-related-rule-definitions"
import { typeRelatedRuleDefinitions } from "@/definitions/type-related-rule-definitions"
import { valueExpressionRelatedRuleDefinitions } from "@/definitions/value-expression-related-rule-definitions"
import { typeExpressionRelatedRuleDefinitions } from "@/definitions/type-expression-related-rule-definitions"

export const ruleDefinitions: AstNodeDefinition[] = [
  {
    type: "global_statements",
    rule: [
      ["global_statements", "global_statement"],
      ["global_statement"],
    ],
    transparentIf: [
      { parentIs: "global_statements" },
    ],
  },
  {
    type: "global_statement",
    rule: [
      ["type_statement"],
      ["def_statement"],
    ],
    transparentIf: [
      { always: true },
    ],
  },

  ...defRelatedRuleDefinitions,
  ...typeRelatedRuleDefinitions,
  ...valueExpressionRelatedRuleDefinitions,
  ...typeExpressionRelatedRuleDefinitions,
]
