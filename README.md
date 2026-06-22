# Undefined C

Yet another language which wants to replace C.

Language features:

* Adopted from C:
  * Basic memory model
  * Pointers
  * Syntax feeling
* Improved based on C:
  * Better typing system with `I32` or `F64` as primitive types
  * Better type composing system with `Array<I32, 5>`, `Pointer<I32>` or `Array<func (I32) -> I32>`, to aVoid the mess in type constructions
  * Module system (namespacing)
  * Receiver syntax for struct
  * A powerful template system which can utilise the whole power of the language itself
  * Easy interoperation with C language
