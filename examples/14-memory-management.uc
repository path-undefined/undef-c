use package std::io;
use package std::mem;

use symbol std::mem::GeneralPurposeAllocator;

lit main = fun () -> Void {
  def allocator = init GeneralPurposeAllocator();
  defer clear GeneralPurposeAllocator;

  def num: USize = 15;

  def ptr: Slice<I32> = alloc:allocator I32 count num;
  defer free:allocator ptr;
  
  for (def i: I32 = 0; i < 5; i += 1) {
    ptr[i] = i;
  }

  std::io::printf("The 3rd element is %d.\n", ptr[2]);
};
