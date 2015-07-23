#pgTest.py
import sys, random, math, itertools
import psycopg2 as pg
import time
from numpy import *
import Gnuplot, Gnuplot.funcutils

def binToRecTrans(bin, numCols):

	#input binary representation, return list of columns, chunk

	bin = str(bin)

	col = [i for i in range(numCols) if(bin[i] == '1')]
	chunk = int(bin[numCols:], 2)

	return col, chunk

def recToBinTrans(col, chunk, numCols, numChunks):

	#input list of columns relevant, chunk number
	binLen = math.ceil(numCols + math.log(numChunks, 2))
	chunkBinLen = math.ceil(math.log(numChunks, 2))

	colBin = ""

	for x in range(numCols + 1):
		if(x in col):
			colBin += '1'
		else:
			colBin += '0'

	chunkBin = bin(chunk)[2:]
	if(len(chunkBin) < chunkBinLen):
		lcb = len(chunkBin)
		for x in range(chunkBinLen - lcb):
			chunkBin = "0" + chunkBin

	return colBin + chunkBin

def createDCTable(cur, conn, table, levels, numChunks, numCols, numRows, two = 0):
	
	timing = []

	startTime = time.time()

	maxRows = (2**numCols - 1)*numChunks
	#sizeChunk = math.ceil(numRows/numChunks)
	sizeChunk = math.floor(numRows/numChunks)

	createTable(cur, conn, 'dc_' + table, 6, 1)

	cur.execute("SELECT column_name from information_schema.columns where table_name='" + table + "'");
	colList = [x[0] for x in cur.fetchall()]

	timing.append(time.time() - startTime)
	startTime = time.time()

	#level 1 Postgres
	for j in range(1, numCols+1):
		for x in range(numChunks):

			cur.execute("SELECT AVG(ss), STDDEV(ss), VAR_SAMP(ss) FROM (SELECT " 
				+ colList[j] + " AS ss FROM " 
				+ table + " LIMIT " + str(sizeChunk) 
				+ " OFFSET " + str(x*sizeChunk) + ") as foo")
			avg, stddev, var = cur.fetchone()

			med = 0 #median????

			#cur.execute("SELECT TOP 1 COUNT( ) val, freq FROM " + table + " GROUP BY " + colList[j] + " ORDER BY COUNT( ) DESC")
			#mod = int(cur.fetchone()[0])
			mod = 0
			cur.execute("INSERT INTO dc_" + table + " (col0, col1, col2, col3, col4, col5) VALUES (%s, %s, %s, %s, %s, %s)",
				[recToBinTrans([j], x, numCols, numChunks), avg, stddev,var,med,mod])
	
	timing.append(time.time() - startTime)
	startTime = time.time()
	
	#level 2 DC
	for i, j in itertools.combinations(range(1, numCols+1), 2):
		for c in range(numChunks):
			cur.execute("SELECT CORR(x, y) FROM (SELECT cast(" + colList[j] + " as double precision) AS x, cast(" 
				+ colList[i] + " as double precision) AS y FROM " 
				+ table + " LIMIT " + str(sizeChunk) 
				+ " OFFSET " + str(c*sizeChunk) + ") as foo")

			cur.execute("INSERT INTO dc_" + table + " (col0, col1) VALUES (%s, %s)", 
				[recToBinTrans([i, j], c, numCols, numChunks),float(cur.fetchone()[0])])

	timing.append(time.time() - startTime)
	startTime = time.time()

	#3-n Levels
	for i in range(3, levels+1):

		comb = list(itertools.combinations(range(1, numCols + 1), i))
		for cval in range(numChunks):
			for j in comb:
				vals = []
				if(two == 1):
					comb2 = list(itertools.combinations(j, 2))
				else:
					comb2 = list(itertools.combinations(j, i-1))
				for k in comb2:
					cur.execute("SELECT col1 FROM dc_" + table + " WHERE col0 = cast('" 
						+ recToBinTrans(k, cval, numCols, numChunks) + "' as varbit)")
					vals.append(cur.fetchone()[0])				

				correlation = sum(vals) + 42

				cur.execute("INSERT INTO dc_" + table + " (col0, col1) VALUES (%s, %s)", 
					[recToBinTrans(j, cval, numCols, numChunks), correlation])

	timing.append(time.time() - startTime)

	print("done")

	return timing

def createTable(cur, conn, name, numCol, b=0):

	if(b == 1):
		cols = "(col0 varbit PRIMARY KEY,"
		for x in range(1, numCol):
			cols += "col" + str(x) + " double precision,"
	else:
		cols = "("
		for x in range(numCol):
			cols += "col" + str(x) + " int,"
	

	cols = cols[:-1]

	cols += ")"

	cur.execute("CREATE TABLE " + name + " " + cols)

def insertRandData(cur, conn, table, length):

	cur.execute("SELECT column_name from information_schema.columns where table_name='" + table + "'");
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


def getAllData(cur, conn, table):
	cur.execute("SELECT * FROM " + table)
	print(cur.fetchall())

def main():
	#DC INFO
	numChunks = 5
	numCols = 5
	numRows = 10000
	levels = numCols

	conn = pg.connect(dbname="postgres")
	cur = conn.cursor()

	if(sys.argv[1] == "get"):
		getAllData(cur, conn, sys.argv[2])
	elif(sys.argv[1] == "insert"):
		insertRandData(cur, conn, sys.argv[2], sys.argv[3])
	elif(sys.argv[1] == "graph"):
		graphData(cur, conn, sys.argv[2], sys.argv[3])
	elif(sys.argv[1] == "create"):
		createTable(cur, conn, sys.argv[2], int(sys.argv[3]))
	elif(sys.argv[1] == "createdc"):
		createDCTable(cur, conn, sys.argv[2], levels, numChunks, numCols, numRows)

	conn.commit()
	cur.close()
	conn.close()
	print("Run time: ", time.time() - startTime, " seconds")

def test():
	numChunks = 5
	numCols = 10
	numRows = 10000

	conn = pg.connect(dbname="postgres")
	cur = conn.cursor()
	createTable(cur, conn, "test", numCols + 1)
	insertRandData(cur, conn, "test", numRows)
	conn.commit()
	timing = createDCTable(cur, conn, "test", numCols, numChunks, numCols, numRows, 0)

	conn.commit()
	print(timing)

#if __name__=="__main__": startTime = time.time(); main()
if __name__=="__main__": startTime = time.time(); test()
