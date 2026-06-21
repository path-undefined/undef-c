package main;

typ Person = struct {
  public const name: Slice<const U8>,
  public const age: U8 = 0,

  public getOlder: const = fun () -> Void {
    this.age += 1;
  },
};

def main: const = fun () -> Void {
  def person1 = { name = "John Doe", age = 36 }: Person;
  def person2: Person = { name = "Jane Joe", age = 27 };

  person1.getOlder();

  std::io::printf("%s is now %d years old.\n", person1.name, person1.age);
  std::io::printf("%s is now %d years old.\n", person2.name, person2.age);
};
