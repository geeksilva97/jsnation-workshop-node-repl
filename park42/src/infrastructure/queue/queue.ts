import { Queue } from "bullmq";

type Connection = {
  host: string;
  port: number;
};

export function makeQueue(name: string, connection: Connection): Queue {
  return new Queue(name, {
    connection,
  });
}
