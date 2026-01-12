# Prerequisites

- Docker installed
- MongoDB Shell installed

# Create db

The init-db.js script drops the database!!!

1. Create docker container

```
docker run -d --name mongo -p 27017:27017 mongo:7
```

2. Check the connection with MongoDb

```
mongosh "mongodb://localhost:27017" --eval "db.runCommand({ ping: 1 })"
```

3. Initialize db and create collections

```
mongosh "mongodb://localhost:27017" --file init-db.js
```

4. Check created collection names

```
mongosh "mongodb://localhost:27017/catering_company" --eval "db.getCollectionNames()"
```

# Queries

```
mongosh "mongodb://localhost:27017/catering_company" query6.js
```
