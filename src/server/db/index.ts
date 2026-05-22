import dns from "dns";

// Fallback DNS resolver for Neon database connection:
// Since some local network resolvers (like routers) refuse wildcard subdomains for neon.tech,
// we intercept dns.lookup inside Node.js to resolve Neon hostnames using Google Public DNS (8.8.8.8).
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  if (hostname && hostname.includes("neon.tech")) {
    const resolver = new dns.Resolver();
    resolver.setServers(["8.8.8.8", "8.8.4.4"]);
    resolver.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || !addresses.length) {
        originalLookup(hostname, options, callback);
      } else {
        const castedOptions = (options as any) || {};
        if (castedOptions.all) {
          callback(null, addresses.map(ip => ({ address: ip, family: 4 })) as any);
        } else {
          callback(null, addresses[0], 4);
        }
      }
    });
  } else {
    originalLookup(hostname, options, callback);
  }
} as any;

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
  });
};

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}