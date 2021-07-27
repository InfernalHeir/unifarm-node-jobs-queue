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

addBeneficiaryQueue.process(async (job: Job, done) => {
   logger.info(`JOB: job started with ${job.id}`);
   try {
      const receipt = await addBeneficiary(
         job.data.beneficiaries,
         job.data.vestingAddreses,
         job.data.claimableTokens
      );
      done(null, receipt);
   } catch (error) {
      logger.error(`TX_ERORR: Holder ${job.data.beneficiaries}`);
      throw new Error("some unexpected error");
   }
});

addBeneficiaryQueue.on("error", (error: Error) => {
   logger.error(`QUEUE_SERVER_ERROR: ${error.message}`);
});

addBeneficiaryQueue.on("completed", (job: Job) => {
   logger.info(`JOB_COMPLETED: Wow Job Successfully commited ${job.id}`);
});
