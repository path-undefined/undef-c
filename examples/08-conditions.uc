package main;

def main: const = fun () -> Void {
  for (def i: USize = 0; i < 100; i += 1) {
    if (i % 2 == 0) {
      std::io::printf("%d is a multiply of 2.\n", i);
    } elseif (i % 3 == 0) {
      std::io::printf("%d is a multiply of 3.\n", i);
    } else {
      std::io::printf("%d is neither a multiply of 2, nor a multiply of 3.\n", i);
    }

    switch (i % 3)
    case (0) {
      std::io::printf("As mentioned, %d is a multiply of 3.\n", i);
    }
    case (1) {
      std::io::printf("When %d is divided by 3, the remainder is 1.");
    }
    case (2) {
      std::io::printf("When %d is divided by 3, the remainder is 2.");
    }
  }
};
