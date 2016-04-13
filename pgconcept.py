#pgdc.py
import sys, random, math, itertools
import psycopg2 as pg
import time
#import simplejson as json
from numpy import *

def checkLevel1(x):
	while (((x % 2) == 0) and x > 1): #While x is even and > 1
		x >>= 1
	return (x == 1)

def checkLevel2(x):

	return bin(x).count('1') == 2

def findPercent(nodeCount, sizeDC):
	return 100*(nodeCount/sizeDC)

def createTable(cur, conn, name, numCol, b=0):

	if(b == 1):
		cols = "(col0 bigint PRIMARY KEY,"
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

	dct = []

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

			dct.append(str([avg, std,var,med,mod]) + "|" + str([i]))

			nodeCount+=1

			p = findPercent(nodeCount, sizeDC)
			if(p - prevPercent >= 5):
				#print(json.dumps(dct) + "&", flush=True, sep="")
				prevPercent = p
				sys.stdout.flush()
				dct = []

	if(len(dct) > 0):
		#print(json.dumps(dct) + "&", flush=True, sep="")
		sys.stdout.flush()
		dct = []

	conn.commit()
	return nodeCount

def createDCTableLevel2(table, levels, numChunks, numCols, numRows, nodeCount):
	
	conn = pg.connect(dbname="postgres")
	cur = conn.cursor()

	cur.execute("SELECT column_name from information_schema.columns where table_name='" + table + "'")
	colList = [x[0] for x in cur.fetchall()]

	sizeDC = numChunks * (2**numCols - 1)
	nodeCount = 0
	prevPercent = 0
	sizeChunk = math.ceil(numRows/numChunks)

	dct = []

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
				
				dct.append(str(corr) + "|" + str([i, j]))
			
				nodeCount+=1

				p = findPercent(nodeCount, sizeDC)
				if(p - prevPercent >= 5):
					#print(json.dumps(dct) + "&", flush=True, sep="")
					prevPercent = p
					sys.stdout.flush()
					dct = []


	if(len(dct) > 0):
		#print(json.dumps(dct) + "&", flush=True, sep="")
		sys.stdout.flush()
		dct = []

	conn.commit()
	return nodeCount

def createDCTableLeveln(table, levels, numChunks, numCols, numRows, nodeCount):

	conn = pg.connect(dbname="postgres")
	cur = conn.cursor()

	sizeDC = numChunks * (2**numCols - 1)
	nodeCount = 0
	prevPercent = 0

	dct = []

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

			dct.append(str(correlation) + "|" + str(kids))
			
			nodeCount+=1

			p = findPercent(nodeCount, sizeDC)
			if(p - prevPercent >= 5):
				#print(json.dumps(dct) + "&", flush=True, sep="")
				prevPercent = p
				sys.stdout.flush()
				dct = []

	if(len(dct) > 0):
		#print(json.dumps(dct) + "&", flush=True, sep="")
		sys.stdout.flush()
		dct = []

	conn.commit()
	return nodeCount


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
	
	level = int(sys.argv[1])
	thresh = sys.argv[2]
	columns = sys.argv[3]
	numChunk = int(sys.argv[4]) - 1

	numCols = 5
	numChunks = 10

	numBit = numCols + math.ceil(math.log(10, 2))

	conn = pg.connect(dbname="postgres")
	cur = conn.cursor()

	if(level > 1):
		cur.execute("SELECT CAST(col0 AS bit(" + str(numBit) + ")), col1 FROM dc_democoncept WHERE col1 > " + thresh + " AND col2 IS NULL")
	else:
		cur.execute("SELECT CAST(col0 AS bit(" + str(numBit) + ")), col1, col2, col3, col4, col5 FROM dc_democoncept WHERE col2 IS NOT NULL")

	vals = cur.fetchall()
	valsToPrint = []
	#print(vals)

	if(level > 1):
		for i in vals:
			cols = i[0][:numCols]
			kids = [i for i in range(len(cols)) if(str(i) in columns and cols[i] == '1')]
			chunk = int(i[0][-math.ceil(math.log(10, 2)):], 2)
			#print(chunk == numChunk, level == len(kids), chunk, kids)
			if(chunk == numChunk and level == len(kids)):
				print(str(i[1])[:5] + "|" + str(kids) + "&")
	else:
		for i in vals:
			col = i[0][:numCols].index("1")
			chunk = int(i[0][-math.ceil(math.log(10, 2)):], 2)
			if(chunk == numChunk and str(col) in columns):
				print(str([i[1], i[2], i[3], i[4], i[5]]) + "|" + str([col]) + "&")

	print("done")

	conn.commit()

def createConceptDCTable():
	
	conn = pg.connect(user="postgres", dbname="postgres")
	cur = conn.cursor()

	numCols = 5
	numRows = 1000
	numChunks = 10

	createTable(cur, conn, "democoncept", numCols)
	insertRandData(cur, conn, "democoncept", numRows)
	conn.commit()


	createDCTableSetup("democoncept", numCols, numChunks, numCols, numRows)
	#print("setup done")
	nodeCount = createDCTableLevel1("democoncept", numCols, numChunks, numCols, numRows)
	#print("level 1 made")
	nodeCount = createDCTableLevel2("democoncept", numCols, numChunks, numCols, numRows, nodeCount)
	#print("level 2 made")
	createDCTableLeveln("democoncept", numCols, numChunks, numCols, numRows, nodeCount)
	#print("done")

	conn.commit()

#if __name__=="__main__": startTime = time.time(); createConceptDCTable()
if __name__=="__main__": startTime = time.time(); demo()
