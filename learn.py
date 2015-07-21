#learn.py
import random, time, sys, itertools

a = int(sys.argv[1])

for x in range(a):
    print(str(random.randint(23,28))+" C " + str(x), flush=True)
    sys.stdout.flush()
    time.sleep(random.uniform(0.4,5))