# SHOP-48: findings

## Q1: Where does the time go?

- Answer: The database. The list query sorts the orders by date with no index: 4.1 s of the 4.6 s.
- Evidence: EXPLAIN ANALYZE on the copy with 23,412 orders: Seq Scan on orders, 4,108 ms.

## Q2: Which change brings the list under one second?

- Answer: 
- Evidence: 
- Open: An index on the shop and the date looks likely; it is not tried yet.

## Results

- The time of each layer, in this file.
