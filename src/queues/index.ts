import Queue, { Job } from "bull";
import dotenv from "dotenv";
import { __baseDir } from "../helpers";
import { addBeneficiary } from "../process";
import { logger } from "../logger";

dotenv.config({ path: `${__baseDir}/.env.${process.env.NODE_ENV}` });

export const addBeneficiaryQueue = new Queue("addBeneficiaryQueue", {
   redis: {
      host: process.env.REDIS_HOSTNAME,
      port: 6379,
   },
});

addBeneficiaryQueue.process(async (job: Job) => {
   logger.info(`JOB: job started with ${job.id}`);
   try {
      await addBeneficiary(
         job.data.derivedBeneficiary,
         job.data.vestAddress,
         job.data.claimTokens
      );
   } catch (error) {
      logger.error(`TX_ERORR: Holder ${job.data.derivedBeneficiary}`);
      job.moveToFailed({
         message: "TX_ERORR: exhausted",
      });
   }
});

addBeneficiaryQueue.on("error", (error: Error) => {
   logger.error(`QUEUE_SERVER_ERROR: ${error.message}`);
});

addBeneficiaryQueue.on("completed", (job: Job) => {
   logger.info(`JOB_COMPLETED: Wow Job Successfully commited ${job.id}`);
});
