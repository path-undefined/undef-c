use package std::io;

template Box<T: Type> {
  type this = struct {
    public const value: {{sym T}},

    public init = fun (v: {{sym T}}) -> Void {
      this.value = v;
    },

    public set = fun (v: {{sym T}}) -> Void {
      this.value = v;
    },
    public get = fun () -> {{sym T}} {
      return this.value;
    },
  };
}

template serialize<T: Type> {
  lit this = fun (data: {{sym T}}) -> Void {
    {{meta T as ti}}

    {{if !ti.isStruct}}
      {{throw "Value to be serialized must be a struct"}}
    {{/if}}

    {{foreach ti.fields as field}}
      std::io::printf("%s: %v\n", {{val field.name}}, data.{{sym field.name}});
    {{/foreach}}
  };
}

template FIB<N: I32> {
  {{exec
    lit getFib = fun (n: I32) -> I32 {
      if (n == 1 || n == 2) {
        return 1;
      } else {
        return getFib(n - 1) + getFib(n - 2);
      }
    };
  }}

  lit this: I32 = {{val getFib(N)}};
}

lit main = fun () -> Void {
  use template Box<I32>;
  use template serialize<Box<I32>>;
  use template FIB<5>;

  def box: Box<I32> = init Box<I32>(36);
  box.set(37);

  std::io::printf("The boxed value is %d.\n", box.get());

  serialize<Box<I32>>(box);

  std::io::printf("The 5th number of fibonacci sequence is %d.\n", FIB<5>);
};
