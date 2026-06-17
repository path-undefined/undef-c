import "std/io";

def main: const = func () -> Void {
  def num1: I32 = 5;
  def num2: I32 = 7;

  io::printf("%d + %d = %d\n", num1, num2, num1 + num2);
};
