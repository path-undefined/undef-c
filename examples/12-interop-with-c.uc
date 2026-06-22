package main;

use "myheader.h";

use extern def funcInCHeader: const fun (a: I32, b: I32) -> I32;
use extern typ StructInCHeader = struct {
  x: I32,
  y: I32,
};
use extern lit CONSTANT_IN_C_HEADER: I32;

use "stdio.h";

use extern def printf: const fun (format: Slice<const U8>, ...args: Slice<Any>) -> Void;

def add: const = fun (a: I32, b: I32) -> I32 {
  return a + b;
};

export extern add;

export funcInCHeader;
export StructInCHeader;
export CONSTANT_IN_C_HEADER;
