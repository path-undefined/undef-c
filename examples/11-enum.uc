use package std::io;

type Mode = enum {
  READ = 1,
  WRITE = 2,
  EXEC = 4,
}: U32;

type Direction = enum {
  NORTH = "north",
  SOUTH = "south",
  EAST = "east",
  WEST = "west",
}: Slice<const U8>;

lit main = fun () -> Void {
  def mode: U32 = Mode.READ | Mode.WRITE;

  if (mode & Mode.READ > 0) {
    std::io::printf("File is readable.\n");
  }
  if (mode & Mode.WRITE > 0) {
    std::io::printf("File is writable.\n");
  }
  if (mode & Mode.EXEC > 0) {
    std::io::printf("File is executable.\n");
  }

  def direction = Direction.NORTH;

  std::io::printf("Current direction is: %s.\n", direction);
};
