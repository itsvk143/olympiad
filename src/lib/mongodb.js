import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
    console.warn('Please add your Mongo URI to .env.local');
}

let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/testseries';

// Ensure the URI targets the 'testseries' database if no database path was provided
if (uri && !uri.startsWith('mongodb://localhost:27017/fallback')) {
    try {
        const parsed = new URL(uri);
        if (!parsed.pathname || parsed.pathname === '/') {
            parsed.pathname = '/testseries';
            uri = parsed.toString();
        }
    } catch {
        if (uri.endsWith('/')) {
            uri = `${uri}testseries`;
        }
    }
}
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable to preserve the client across module reloads
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, create a new client
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;
