import express, { Application, Request, Response } from "express";
import { json, urlencoded } from "body-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import {
   benficiaryDetails,
   getBenficiaryFromSmartContract,
   __baseDir,
   getJobId,
} from "./helpers";
import { addBeneficiaryQueue } from "./queues";
import { logger } from "./logger";
import _ from "lodash";
import Fuse from "fuse.js";
import cors from "cors";
import { Job } from "bull";

dotenv.config({ path: `${__baseDir}/.env.${process.env.NODE_ENV}` });

const PORT = Number(process.env.PORT);
const HOSTNAME = String(process.env.REDIS_HOSTNAME);

const app: Application = express();

// set the parser middleware
app.use(json({ limit: "50kb", strict: true }));
// set the url encoded
app.use(urlencoded({ extended: true }));

// set the morgon logger
app.use(morgan("combined"));

app.use(cors());

app.post("/beneficiary-request", async (req, res) => {
   try {
      // grab the msgSender from the post body
      const msgSender = req.body.msgSender;

      // get beneficiary details
      const beneficiary = await benficiaryDetails(msgSender);

      // reject it self if he/she not the beneficiary.
      if (_.isEmpty(beneficiary)) {
         return res.status(400).json({
            code: 400,
            message: "Forbidden Permission Denied!",
         });
      }

      const registeredBeneficiary = await getBenficiaryFromSmartContract(
         msgSender
      );

      const diff = _.xorBy(beneficiary, registeredBeneficiary, "vestAddress");

      if (_.isEmpty(diff)) {
         return res.json({
            code: 200,
            message: "there is no more vesting for this address.",
         });
      }

      const alwaysLast = _.subtract(diff.length, 1);

      const derivedBeneficiary = beneficiary[alwaysLast].beneficiaryAddress;
      const vestAddress = beneficiary[alwaysLast].vestAddress;
      const claimTokens = beneficiary[alwaysLast].claimTokens;

      //const jobId = getJobId(derivedBeneficiary, vestAddress);

      const job = await addBeneficiaryQueue.add(
         { derivedBeneficiary, vestAddress, claimTokens },
         {
            delay: 180 * 1000, // in 3 minutes
            attempts: 5,
            backoff: 5,
         }
      );
      logger.info(`JOB:: Job Added Successfully with ${job.id}`);

      return res.status(200).json({
         code: 200,
         message: "Job Added!",
      });
   } catch (err) {
      logger.error(`ROUTE:: ${err.message}`);
      return res.status(500).json({
         code: 500,
         message: err.message,
      });
   }
});

app.get("/jobStatus", async (req: Request, res: Response) => {
   const jobId = Number(req.query["jobId"]);
   const jobDetails = await addBeneficiaryQueue.getJob(jobId);
   res.status(200).json({
      code: 200,
      data: {
         timeStamp: jobDetails?.timestamp,
         finishTime: jobDetails?.finishedOn,
         processTime: jobDetails?.processedOn,
      },
   });
});

// if no route found
app.use(function (req, res, next) {
   logger.error(`BAD_REQUEST: one bad request found from ${req.ip}`);
   res.status(400).json({
      code: 400,
      message: "BAD_REQUEST:: no route found.",
   });
});

app.listen(PORT, HOSTNAME, async () => {
   logger.info(`Queue server running at ${PORT}`);
});
