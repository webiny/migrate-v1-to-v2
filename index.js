// Load .env
require("dotenv").config();
const { MongoClient } = require("mongodb");
const migrate = require("./migrate");

const host = process.env.MONGODB_SERVER;
const dbName = process.env.MONGODB_NAME;

(async () => {
    try {
        console.log("🔌 Connecting to database...");
        const client = await MongoClient.connect(host, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const dbInstance = client.db(dbName);
        await migrate(dbInstance, { host, dbName });
    } catch (e) {
        console.log(e);
    }

    process.exit();
})();
