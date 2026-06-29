package main;

fun main() -> Void {
  def pi: const F64 = 3.1415926536;

  std::io::printf("Contant pi is: %d.\n", pi);

  def num: I32 = 36;
  def num = 37;

  std::io::printf("Variable num is now: %d.\n", num);

  def finished = true;

  std::io::printf(
    "It is finised: %s.\n",
    ${ if (finished) { break "true"; } else { break "false"; } },
  );
};
