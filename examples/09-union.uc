package main;

typ Color = union {
  value: U32,
  struct {
    r: U8,
    g: U8,
    b: U8,
    a: U8,
  },
};

fun main() -> Void {
  def color = { value = 0xEE8800FF }: Color;

  std::io::printf("The Hex value of the color is %0x08X.\n", color.value);
  std::io::printf("The RGBA value of the color is (r:%d, g:%d, b:%d, a:%d).\n", color.r, color.g, color.b, color.a);
};
