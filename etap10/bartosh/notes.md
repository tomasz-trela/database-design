1) MongoDb
+ scalability
+ indexes
+ json like
+ agregation
- more difficult sharding
+/- custom query language

Verdict: good

2) CouchDb
+ scalability
+ document + key-value
+ bulit-in cache for low latency
- more complex setup
- more expensive

Vertict: overkill

2) Neo4j
+ good for graph data
+ graph queries
- scalability

Verdict: meals recomendations????

3) Cassandra
+ global availablity
+ scalability
+ good for big data volume
+ low latency
- more difficult configuation
- no joins and complicated queries

Vertict: overkill

4) Redis
+ incredibly fast
+ simplicity
- in-memory (the data is lost after system restart)
- not good for complicated queries

Vertict: nah

5) DynamoDb
+ global availablity
+ scalability
+ AWS integration
+ easy to manage
- costs
- no joins

Vertict: nah