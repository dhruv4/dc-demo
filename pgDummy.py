#pgDummy.py
import random, time, sys, itertools

rows = int(sys.argv[1])
cols = int(sys.argv[2])
chunks = int(sys.argv[3])

for x in range(1, cols+1):
    print(str(random.randint(23,28123)), str(x), flush=True)
    sys.stdout.flush()
    time.sleep(random.uniform(0.4,5))

print("done")