package main;

fun main() -> Void {
  def arr: Array<I32, 10>;

  for (def i: USize = 0; i < 10; i += 1) {
    arr[i] = i;
  }

  def sum: I32 = 0;
  def i: USize = 0;

  while (sum < 15) {
    sum += arr[i];
    i += 1;
  }

  std::io::printf("The sum of first %d elements is greater or equal than 15.\n", i);

  def sumOfRest: I32 = 0;

  loop {
    if (i >= 10) {
      break;
    }

    sumOfRest = arr[i];

    i += 1;
  }

  std::io::printf("The sum of the rest elements is %d.\n", sumOfRest);
};
