use package std::math;
use package mymath;

use symbol std::math::sin;
use symbol mymath::sin as mysin;

lit pi: const F64 = 3.1415926536;

lit result1 = sin(pi);
lit result2 = mysin(pi);
lit result3 = std::math::cos(pi);

export pi;
export sin;
export mysin;
export std::math::cos;
export mymath::cos as mycos;
