# TODO

* Implement a minimal set of grammar so that the compiler can actually work:
  * Implement minimal AST rule set
  * Directly generate code with AST without context awared semantic checking

The minimal set of grammar is:
* [done] define variables
* [done] package system
* define functions
* implement functions
* allocate and recycle memory
* build-in premitive types
* assignments
* if
* for
* switch
* templating
* type system
* [done] expressions
* [done] literals

---

Next steps:
1. parse function definitions
2. [done] parse array literals
3. [done] parse struct/union literals
4. [done] parse function literals
5. parse type aliases
6. parse struct definitions
7. parse union definitions
8. parse enum definitions
9. parse error definitions
