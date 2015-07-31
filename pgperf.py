#pgperf.py
import sys, random, math, itertools
import psycopg2 as pg
import time
from numpy import *

def checkLevel1(x):
	while (((x % 2) == 0) and x > 1): #While x is even and > 1
		x >>= 1
	return (x == 1)

def checkLevel2(x):
	'''
	while (((x & 1) == 0) and x > 1): #/* While x is even and > 1 */
		x >>= 1
	return (x == 2)
	'''
	return bin(x).count('1') == 2

def findPercent(nodeCount, sizeDC):
	return 100*(nodeCount/sizeDC)

def createTable(cur, conn, name, numCol, b=0, l=0):

	if(b == 1):
		if(l == 1):
			cols = "(col0 bigint PRIMARY KEY,"
		else:
			cols = "(col0 int PRIMARY KEY,"
		
		for x in range(1, numCol):
			cols += "col" + str(x) + " double precision,"
	else:
		cols = "("
		for x in range(numCol):
			cols += "col" + str(x) + " int,"
	
	cols = cols[:-1]

	cols += ")"

	cur.execute("CREATE TABLE " + name + " " + cols)

def idChunkCombine(idn, chunk, numChunks):
	return ((idn << math.ceil(math.log(numChunks, 2))) | chunk)

def createDCTableSetup(table, levels, numChunks, numCols, numRows):
	
	conn = pg.connect(dbname="postgres")
	cur = conn.cursor()

	if(numCols + math.ceil(math.log(numChunks, 2)) >= 32):
		createTable(cur, conn, 'dc_' + table, 6, 1, 1)
	else:
		createTable(cur, conn, 'dc_' + table, 6, 1)

	conn.commit()

def createDCTableLevel1(table, levels, numChunks, numCols, numRows):

	conn = pg.connect(dbname="postgres")
	cur = conn.cursor()

	cur.execute("SELECT column_name from information_schema.columns where table_name='" + table + "'")
	colList = [x[0] for x in cur.fetchall()]

	sizeDC = numChunks * (2**numCols - 1)
	nodeCount = 0
	prevPercent = 0
	sizeChunk = math.ceil(numRows/numChunks)

	ID = 1
	for c in range(numChunks):
		for i in range(numCols):

			cur.execute("SELECT AVG(ss), STDDEV(ss), VAR_SAMP(ss) FROM (SELECT " 
				+ colList[i] + " AS ss FROM " 
				+ table + " LIMIT " + str(sizeChunk) 
				+ " OFFSET " + str(c*sizeChunk) + ") as foo")
			
			avg, std, var = cur.fetchone()

			med = 0 #median

			#cur.execute("SELECT TOP 1 COUNT( ) val, freq FROM " + table + " GROUP BY " + colList[j] + " ORDER BY COUNT( ) DESC")
			#mod = int(cur.fetchone()[0])
			mod = 0

			ID = 1<<i

			ID = idChunkCombine(ID, c, numChunks)

			cur.execute("INSERT INTO dc_" + table + " (col0, col1, col2, col3, col4, col5) VALUES (%s, %s, %s, %s, %s, %s)",
				[ID, avg, std,var,med,mod])

			nodeCount+=1

			p = findPercent(nodeCount, sizeDC)
			if(p - prevPercent >= 5):
				print(str(random.randint(23,28123)) + "|" + str(p) + "&", flush=True, sep="")
				prevPercent = p
				sys.stdout.flush()

	conn.commit()
	return nodeCount

def createDCTableLevel2(table, levels, numChunks, numCols, numRows, nodeCount):
	
	conn = pg.connect(dbname="postgres")
	cur = conn.cursor()

	cur.execute("SELECT column_name from information_schema.columns where table_name='" + table + "'")
	colList = [x[0] for x in cur.fetchall()]

	sizeDC = numChunks * (2**numCols - 1)
	prevPercent = findPercent(nodeCount, sizeDC)
	sizeChunk = math.ceil(numRows/numChunks)

	for c in range(numChunks):
		for i in range(numCols - 1):
			for j in range(i+1, numCols):
				cur.execute("SELECT CORR(x, y) FROM (SELECT cast(" + colList[i] + " as double precision) AS x, cast(" 
					+ colList[j] + " as double precision) AS y FROM " 
					+ table + " LIMIT " + str(sizeChunk) 
					+ " OFFSET " + str(c*sizeChunk) + ") as foo")

				####^^^^ This HAS to be the slowest statement right?
				corr = float(cur.fetchone()[0])

				cur.execute("INSERT INTO dc_" + table + " (col0, col1) VALUES (%s, %s)", 
					[idChunkCombine(2**i + 2**j, c, numChunks),corr])

				nodeCount+=1

				p = findPercent(nodeCount, sizeDC)
				if(p - prevPercent >= 5):
					print(str(random.randint(23,28123)) + "|" + str(p) + "&", flush=True, sep="")
					prevPercent = p
					sys.stdout.flush()


	conn.commit()
	return nodeCount

def createDCTableLeveln(table, levels, numChunks, numCols, numRows, nodeCount):

	conn = pg.connect(dbname="postgres")
	cur = conn.cursor()

	sizeDC = numChunks * (2**numCols - 1)
	prevPercent = findPercent(nodeCount, sizeDC)

	for c in range(numChunks):
		for i in range(1, 2**numCols):
			if(checkLevel1(i) == 1 or checkLevel2(i) == 1):
				continue
			
			vals = []
			kids = []
			for x in range(numCols):
				if((i >> x) & 1 == 1):
					for y in range(x+1, numCols):
						if((i >> y) & 1 == 1):
							sys.stdout.flush()
							cur.execute("SELECT col1 FROM dc_" + table + " WHERE col0 = " 
								+ str(idChunkCombine(2**x + 2**y, c, numChunks)))
							
							vals.append(cur.fetchone()[0])
					kids.append(x)
		
			correlation = sum(vals)

			cur.execute("INSERT INTO dc_" + table + " (col0, col1) VALUES (%s, %s)", 
				[idChunkCombine(i, c, numChunks), correlation])

			nodeCount+=1

			p = findPercent(nodeCount, sizeDC)
			if(p - prevPercent >= 5):
				print(str(random.randint(23,28123)) + "|" + str(p) + "&", flush=True, sep="")
				prevPercent = p
				sys.stdout.flush()

	conn.commit()

def insertRandData(cur, conn, table, length):

	cur.execute("SELECT column_name from information_schema.columns where table_name='" + table + "'")
	colList = [x[0] for x in cur.fetchall()]

	for x in range(int(length)):
		exe = "INSERT INTO " + table + " ("

		for x in colList:
			exe += x + ","

		exe = exe[:-1]
		exe += ") values ("

		for x in range(len(colList)):
			exe += "%s, "

		exe = exe[:-2]
		exe += ")"

		cur.execute(exe, [random.randint(0, 5) for x in range(len(colList))])

def demo():
	numRows = int(sys.argv[1])
	numCols = int(sys.argv[2])
	numChunks = int(sys.argv[3])
	name = "demop" + str(random.randint(0, 12412099999999989))

	conn = pg.connect(dbname="postgres")
	cur = conn.cursor()

	createTable(cur, conn, name, numCols)
	insertRandData(cur, conn, name, numRows)
	conn.commit()

	createDCTableSetup(name, numCols, numChunks, numCols, numRows)
	#print("setup done")
	nodeCount = createDCTableLevel1(name, numCols, numChunks, numCols, numRows)
	#print("level 1 made")
	nodeCount = createDCTableLevel2(name, numCols, numChunks, numCols, numRows, nodeCount)
	#print("level 2 made")
	createDCTableLeveln(name, numCols, numChunks, numCols, numRows, nodeCount)
	#print("done")

	conn.commit()

	print("done")
	#print(time.time() - startTime)

	cur.execute("DROP TABLE " + name)
	cur.execute("DROP TABLE dc_" + name)
	conn.commit()

def exp():
	
	if(sys.argv[1] == "setup"):
		createDCTableSetup(sys.argv[2], int(sys.argv[3]),int( sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]))
	elif(sys.argv[1] == "level1"):
		createDCTableLevel1(sys.argv[2], int(sys.argv[3]),int( sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]))
	elif(sys.argv[1] == "level2"):
		createDCTableLevel2(sys.argv[2], int(sys.argv[3]),int( sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]))
	elif(sys.argv[1] == "leveln"):
		createDCTableLeveln(sys.argv[2], int(sys.argv[3]),int( sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]))

#if __name__=="__main__": startTime = time.time(); exp()
if __name__=="__main__": startTime = time.time(); demo()