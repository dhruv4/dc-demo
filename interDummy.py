#interDummy.py
import random, time, sys, itertools, math

rows = int(sys.argv[1])
cols = int(sys.argv[2])
chunks = int(sys.argv[3])

for x in range(1, cols+1):
	stat = ""

	comb = math.factorial(cols)/(math.factorial(x)*math.factorial(cols - x))

	for i in range(int(comb)):
		stat += str(random.uniform(2, 9)) + ","

	stat = stat[:-1]

	print(str(random.randint(23,28123)), str(x), stat, flush=True)
	sys.stdout.flush()
	time.sleep(random.uniform(0.4,5))

print("done")