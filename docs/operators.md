# Operators

A list of operators in the order of precedence:

```
MAX  Value:        () identifiers literals {{val}} ${}
 90  Address:      $ @
 80  DataAccess:   . [] () :
 70  Unary:        + - ! ~ alloc free init clean
 60  BinaryHigh:   * / % << >> &
 50  BinaryLow:    + - | ^
 40  Comparison:   < > <= >= == !=
 30  LogicAnd:     &&
 20  LogicOr:      ||
 10  Assignment:   = += -= *= /= %= <<= >>= &= ^= |=
```
