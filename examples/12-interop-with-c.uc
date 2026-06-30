use header "myheader.h";

use extern lit funcInCHeader: (a: I32, b: I32) -> I32;
use extern type StructInCHeader = struct {
  x: I32,
  y: I32,
};
use extern lit CONSTANT_IN_C_HEADER: I32;

use header "stdio.h";

use extern lit printf: (format: Slice<const U8>, ...args: Slice<Any>) -> Void;

lit add = fun (a: I32, b: I32) -> I32 {
  return a + b;
};

export extern add;

export funcInCHeader;
export StructInCHeader;
export CONSTANT_IN_C_HEADER;
