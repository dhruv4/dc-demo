#interDummy.py
import random, time, sys, itertools, math, json

rows = int(sys.argv[1])
cols = int(sys.argv[2])
chunks = int(sys.argv[3])

time.sleep(100)

for y in range(1, chunks+1):
	for x in range(1, cols+1):

		stat = {}

		#comb = math.factorial(cols)/(math.factorial(x)*math.factorial(cols - x))
		comb = list(itertools.combinations(range(1, cols + 1), x))
		
		for i in comb:
			if x == 1:

				print(str(random.randint(23,28123)) + "|" + str(x) + "|" + str(y) + "|" + str([random.uniform(2, 9) for j in range(5)]) + "|" + str(list(i)), flush=True, sep="")

			else:

				print(str(random.randint(23,28123)) + "|" + str(x) + "|" + str(y) + "|" + str(random.uniform(2, 9)) + "|" + str(list(i)), flush=True, sep="")

			sys.stdout.flush()
			time.sleep(random.uniform(0.4,1))

		time.sleep(random.uniform(0.4,1))

print("done")