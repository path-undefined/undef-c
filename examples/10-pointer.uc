package main;

def main: const = fun () -> Void {
  def ptr: Pointer<I32>;
  def arr = [ 1, 2, 3, 4 ]: Array<I32>;
  def num: I32 = 5;

  ptr = arr;

  for (def i: ISize = 0; i < 4; i += 1) {
    std::io::printf("The value that the pointer is pointing to is: %d.\n", $(ptr + i));
  }

  ptr = @num;

  std::io::printf("The value that the pointer is pointing to is: %d.\n", $ptr);
};
