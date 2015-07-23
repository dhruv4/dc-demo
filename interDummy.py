#interDummy.py
import random, time, sys, itertools, math, json

rows = int(sys.argv[1])
cols = int(sys.argv[2])
chunks = int(sys.argv[3])

for x in range(1, cols+1):

	stat = {}

	#comb = math.factorial(cols)/(math.factorial(x)*math.factorial(cols - x))
	comb = list(itertools.combinations(range(1, cols + 1), x))
	
	for i in comb:
		if x == 1:
			stat[str([random.uniform(2, 9) for j in range(5)])] = i
		else:
			stat[random.uniform(2, 9)] = i

	print(str(random.randint(23,28123)) + "|" + str(x) + "|" + json.dumps(stat), flush=True, sep="")
	sys.stdout.flush()
	time.sleep(random.uniform(0.4,5))

print("done")