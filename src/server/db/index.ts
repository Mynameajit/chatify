import dns from "dns";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const originalLookup = dns.lookup;

dns.lookup = function (
  hostname: string,
  options: any,
  callback: any
) {
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
        const castedOptions = options || {};

        if (castedOptions.all) {
          callback(
            null,
            addresses.map((ip) => ({
              address: ip,
              family: 4,
            }))
          );

        } else {
          callback(null, addresses[0], 4);
        }
      }
    });

  } else {
    originalLookup(hostname, options, callback);
  }

} as typeof dns.lookup;

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
  // eslint-disable-next-line no-var
  var prismaGlobal:
    | ReturnType<typeof prismaClientSingleton>
    | undefined;
}

const prisma =
  globalThis.prismaGlobal ??
  prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}