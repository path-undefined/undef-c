package main;

use std::math::sin;
use mymath::sin as mysin;

def pi: const F64 = 3.1415926536;

def result1 = sin(pi);
def result2 = mysin(pi);
def result3 = std::math::cos(pi);

export pi;
export sin;
export mysin;
export std::math::cos;
export mymath::cos as mycos;
