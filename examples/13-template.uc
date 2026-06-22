package main;

tmpl Box<T: Type> {
  typ Box<{{sym T}}> = struct {
    public const value: {{sym T}},

    set: const = fun (v: {{sym T}}) -> Void {
      this.value = v;
    },
    get: const = fun () -> {{sym T}} {
      return this.value;
    },
  };
}

tmpl Serialize<T: Type> {
  def serialize<{{sym T}}>: const = fun (data: {{sym T}}) -> Void {
    {{meta T as ti}}

    {{if !ti.isStruct}}
      {{throw "Value to be serialized must be a struct"}}
    {{/if}}

    {{for field in ti.fields}}
      std::io::printf("%s: %v\n", {{lit field.name}}, data.{{sym field.name}});
    {{/for}}
  };
}

tmpl Fib<N: I32> {
  {{eval
    def getFib: const = fun (n: I32) -> I32 {
      if (n == 1 || n == 2) {
        return 1;
      } else {
        return getFib(n - 1) + getFib(n - 2);
      }
    };
  }}

  lit fib<{{sym N}}>: I32 = {{lit getFib(N)}};
}

def main: const = fun () -> Void {
  use tmpl Box<I32>;

  def box = { value = 36 }: Box<I32>;
  box.set(37);

  std::io::printf("The boxed value is %d.\n", box.get());

  use tmpl Serialize<Box<I32>>;

  serialize<Box<I32>>(box);

  use tmpl Fib<5>;

  std::io::printf("The 5th number of fibonacci sequence is %d.\n", fib<5>);
};
