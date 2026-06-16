# Undefined C

Yet another language which wants to replace C.

Language features:

* Adopted from C:
  * Basic memory model
  * Pointers
  * Syntax feeling
* Improved based on C:
  * Better typing system with `i32` or `f64` as primitive types
  * Better type composing system with `array<i32, 5>`, `pointer<i32>` or `array<func (i32) -> i32>`, to avoid the mess in type constructions
  * Module system (namespacing)
  * Receiver syntax for struct
  * A powerful template system which can utilise the whole power of the language itself
  * Easy interoperation with C language

## Syntax

### 1. Comments

```
// This is a comment
```

### 2. Import and Export

```
import "./math.uc" as math;

def pi: const f64 = 3.14159;

export math.add as plus;
export pi;
```

### 3. Variables, Constants and Assignments

```
def pi: const f64 = 3.14159;
// pi = 5 <-- Not allow because it is const

def num: i32 = 36;
def num = 37;

def finish = true; // Automatic type inferrence
```

### 4. Functions

```
def add = const func (a: i32, b: i32) -> i32 {
  return a + b
};
```

### 5. Arrays and Slices

```
def arr = array<i32> { 1, 2, 3, 4 };

def i = arr[1];
arr[0] = 5;
// 5, 2, 3, 4

def s: slice<i32> = arr[1..];
s[0] = 6;
// 5, 6, 3, 4

def len: isize = s.length;
// 3
```

### 6. Structs

```
type Person = struct {
  name: slice<const u8>,
  age: u8,
};

def getOlder = const func Person.() -> void {
  self.age += 1
};

def person: Person = Person { name: "John Doe", age: 36 };
person.getOlder();

def num = person.age;
// 37
```

### 7. Unions

```
type Color = union {
  value: u32,
  struct {
    a: u8,
    b: u8,
    g: u8,
    r: u8,
  },
};

def color = Color { value: 0xFF0088FF };
def red = color.r;
```

### 8. Pointers

```
def ptr: pointer<i32>;
def arr = array<i32>{ 1, 2, 3, 4 };

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

def mode: u32 = Mode.READ | Mode.WRITE;

type Direction = enum {
  NORTH: "north",
  SOUTH: "south",
  EAST: "east",
  WEST: "west",
} as slice<const u8>;

def direction: Direction = Direction.NORTH;
```

### 10. Templates

Generics:

```
#template (T: type) {{
  type Box<> = struct {
    value: #type(T),
  };

  def set = const func Box<>.(v: #type(T)) -> void {
    self.value = v;
  };

  def get = const func Box<>.() -> #type(T) {
    return self.value;
  };
}}

def box = Box<i32> { value: 36 };
box.set(37);
def num = box.get();
```

Reflections:

```
#template (T: type) {{
  def serialize = const func (<>, data: #type(T)) -> void {
    #if (!typeinfo(T).isStruct) {{
      #compile_error ("Value to be serialized must be a struct");
    }}

    #for (field: typeinfo(T).fields) {{
      std.io.printf("$s: $v\n", #value(field.name), data.#id(field.name));
    }}
  };
}}

type Position = struct {
  x: i32,
  y: i32,
};

def pos = Position { x: 2, y: 3 };

serialize#<Position>(pos);
```

Constants:

```
#template (N: i32) {{
  #eval {{
    def getFib = const func(n: i32) -> {
      if (n == 1 || n == 2) {
        return 1;
      } else {
        return getFib(n - 1) + getFib(n - 2);
      }
    };

    export getFib;
  }}

  def fib#<>: const i32 = #value(getFib(N));
}}

def result = fib#<5>;
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

### 12. Interoperate with C

Mapping file:

```
use "path/to/include/example.h";

extern def funcInCHeader: const func (i32, i32) -> i32;
extern type StructInCHeader: struct {
  x: i32,
  y: i32,
};
extern def CONSTANT_IN_C_HEADER: i32;

export funcInCHeader;
export StructInCHeader;
export CONSTANT_IN_C_HEADER;
```

Another file:

```
import "std" as std;
import "./clib.uc" as clib;

def main = const func () -> void {
  std.io.printf("The constant is %d\n", clib.CONSTANT_IN_C_HEADER);
  std.io.printf("The result is %d\n", clib.funcInCHeader(4, 6));
};
```
