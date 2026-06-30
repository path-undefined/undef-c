use package std::io;

lit main = fun () -> Void {
  def arr1 = [ 1, 2, 3, 4 ]:Array<I32>;
  def arr2: Array<I32, 4> = [5, 6, 7, 8];

  arr1[0] = 5;
  arr2[0] = 9;

  def slice1: Slice<I32> = arr1[..];
  def slice2: Slice<I32> = arr2[1..4];

  std::io::printf("The length of slice1 is %d.\n", slice1.length);
  std::io::printf("The first element of slice1 is %d.\n", slice1[0]);

  std::io::printf("The length of slice2 is %d.\n", slice2.length);
  std::io::printf("The first element of slice2 is %d.\n", slice2[0]);
};
