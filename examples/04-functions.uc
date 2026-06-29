package main;

fun main() -> Void {
  std::io::printf("Adding 5 and 6 is %d.\n", add(5, 6));
  std::io::printf("The sum of 2, 3, 5, 7 is %d.\n", sum(2, 3, 5, 7));

  sayHelloTo("Undef-C");

  try {
    div(5, 0);
  } catch (e: DivError) {
    std::io::printf("Oh no, number can't be divided by 0.\n");
  }
};

fun add(a: I32, b: I32) -> I32 {
  return a + b;
};

fun sum(...n: Slice<I32>) -> I32 {
  def result: I32 = 0;

  for (def i: USize = 0; i < n.length; i += 1) {
    result += n[i];
  }

  return result;
};

fun sayHelloTo(name: Slice<U8>) -> Void {
  std::io::printf("Hello, %s!\n", name);
};

typ DivError = error {
  DIVISOR_IS_ZERO,
};

fun div(a: F64, b: F64) -> F64 throw DivError {
  if (b == 0) {
    throw DivError.DIVISOR_IS_ZERO;
  }

  return a / b;
};
