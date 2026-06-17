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

## Syntax

### 1. Comments

```
// This is a comment
```

### 2. Namespacing

```
import "std/io";
import "std/math";
import "math" as mymath;

use math::*;
use mymath::sqrt as mysqrt;

def pi: const F64 = 3.1415926536;

export sqrt;
export mysqrt;
export mymath::asin;
export mymath::acos as myacos;
export io::*;
export pi;
```

### 3. Variables, Constants and Assignments

```
def pi: const F64 = 3.1415926536;
// pi = 5 <-- Error! Because it is const.

def num: I32 = 36;
def num = 37;

def finish = true; // Automatic type inferrence
```

### 4. Functions

Normal function:

```
def add: const = func (a: I32, b: I32) -> I32 {
  return a + b;
};

def result = add(3, 5);
```

With out return values:

```
import "std/io";

def sayHelloTo: const = func (name: Slice:<U8>) -> Void {
  io::printf("Hello, %s!\n", name);
}

sayHelloTo("John");
```

With error:

```
type DivError = error {
  DIVISOR_IS_ZERO,
};

def div: const = func (a: F64, b: F64) -> F64 {
  if (b == 0) {
    throw DivError.DIVISOR_IS_ZERO;
  }

  return a / b;
}

def result = div(5, 0) catch 0;
```

### 5. Arrays and Slices

```
def arr = Array:<I32> { 1, 2, 3, 4 };

def i = arr[1];
arr[0] = 5;
// 5, 2, 3, 4

def s: Slice:<I32> = arr[1..];
s[0] = 6;
// 5, 6, 3, 4

def len: USize = s.length;
// 3
```

### 6. Structs

```
type Person = struct {
  name: Slice:<const U8>,
  age: U8,
};

def getOlder: const = func Person.() -> Void {
  this.age += 1
};

def person = Person { name: "John Doe", age: 36 };
person.getOlder();

def num = person.age;
// 37
```

### 7. Unions

```
type Color = union {
  value: U32,
  struct {
    a: U8,
    b: U8,
    g: U8,
    r: U8,
  },
};

def color = Color { value: 0xFF0088FF };
def green = color.g;
// 0x00 if little endian
```

### 8. Pointers

```
def ptr: Pointer<I32>;
def arr = Array<I32>{ 1, 2, 3, 4 };

ptr = @arr;
ptr += 2;

def num1 = $ptr;
// 3

def num2 = $(ptr - 1);
// 2
```

### 9. Enums

```
type Mode = enum {
  READ: 1,
  WRITE: 2,
  EXEC: 4,
} as u32;

def mode: U32 = Mode.READ | Mode.WRITE;

type Direction = enum {
  NORTH: "north",
  SOUTH: "south",
  EAST: "east",
  WEST: "west",
} as Slice:<const U8>;

def direction: Direction = Direction.NORTH;
```

### 10. Templates

Generics:

```
template Box(T: TypeExp) {{
  type Box:<{{type T}}> = struct {
    value: {{type T}},
  };

  def set = const func Box:<{{type T}}>.(v: {{type T}}) -> Void {
    this.value = v;
  };

  def get = const func Box:<{{type T}}>.() -> {{type T}} {
    return this.value;
  }
}}

use template Box(I32);

def box = Box:<I32> { value: 36 };
box.set(37);
def num = box.get();
```

Reflections:

```
template Serialize(T: TypeExp) {{
  def serialize:<{{type T}}>: const = const func (data: {{type T}}) -> Void {
    {{typemeta T as ti}}

    {{if ti.isStruct}}
      {{throw "Value to be serialized must be a struct"}}
    {{/if}}

    {{for field in ti.fields}}
      std.io.printf("%s: %v\n", {{lit field.name}}, data.{{identifier field.name}});
    {{/for}}
  };
}}

type Position = struct {
  x: I32,
  y: I32,
};

def pos = Position { x: 2, y: 3 };

use template Serialize(Position);
serialize:<Position>(pos);
// x: 2
// y: 3
```

Constants:

```
template Fib(N: I32) {{
  #{{
    def getFib = const func(n: I32) -> {
      if (n == 1 || n == 2) {
        return 1;
      } else {
        return getFib(n - 1) + getFib(n - 2);
      }
    };
  }}

  lit fib:<{{type N}}>: I32 = {{value getFib(N)}};
}}

use template Fib(6);

def result = fib:<6>;
// Literally equivalent to:
// def result = 8;
```

Deal with endians:

```
template ColorStruct(E: Endian) {{
  ${{
    type Endian = enum {
      LITTLE,
      BIG,
    };
  }}

  type Color = union {
    value: U32,
    packed struct {
      {{if E === Endian.LITTLE}}
        a: U32, b: U32, g: U32, r: U32,
      {{/if}}

      {{if E === Endian.BIG}}
        r: U32, g: U32, b: U32, a: U32,
      {{/if}}
    },
  };
}}

use template ColorStruct(Endian.BIG);

def color = Color { value: 0xFF0088FF };
def green = color.g;
// 0x00 because of big endian
```

### 11. Control Flow

if - else if - else:

```
if (x >= 70) {
  // ...
} else if (x >= 30) {
  // ...
} else {
  // ...
}
```

For loop:

```
for (def i = 0; i < 10; i += 1) {
  // ...
}

for (i < 10) {
  // ...
}

for {
  // ...
}
```

Switch:

```
switch (c) {
  case 1: continue
  case 2:
    // ...
  case 3:
    // ...
  default:
    // ...
}

switch (v) {
  case SomeEnum.VALUE1:
    // ...
  case SomeEnum.VALUE2:
    // ...
  // No default is allowed here
}
```

### 12. Ieroperate with C

Mapping file:

```
include "path/to/include/example.h";

use extern def funcInCHeader: const func (I32, I32) -> I32;
use extern type StructInCHeader: struct {
  x: I32,
  y: I32,
};
use extern lit CONSTANT_IN_C_HEADER: I32;

export funcInCHeader;
export StructInCHeader;
export CONSTANT_IN_C_HEADER;
```

Another file:

```
import "std" as std;
import "./clib.uc" as clib;

def main = const func () -> Void {
  std.io.printf("The constant is %d\n", clib.CONSTANT_IN_C_HEADER);
  std.io.printf("The result is %d\n", clib.funcInCHeader(4, 6));
};
```
