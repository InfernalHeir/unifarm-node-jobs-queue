import express, { Application } from "express";
import { json, urlencoded } from "body-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import {
   benficiaryDetails,
   getBenficiaryFromSmartContract,
   __baseDir,
} from "./helpers";
import { addBeneficiaryQueue } from "./queues";
import { logger } from "./logger";
import _ from "lodash";
import Fuse from "fuse.js";

dotenv.config({ path: `${__baseDir}/.env.${process.env.NODE_ENV}` });

const PORT = Number(process.env.PORT);

const app: Application = express();

// set the parser middleware
app.use(json({ limit: "50kb", strict: true }));
// set the url encoded
app.use(urlencoded({ extended: true }));

// set the morgon logger
app.use(morgan("combined"));

app.post("/beneficiary-request", async (req, res) => {
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

   //reterive his data from blockchain also
   /* const vestingAddresses = await getBenficiaryFromSmartContract(msgSender);
   // put an additional check if its not empty
   const fuse = new Fuse(beneficiary,{
      keys: ["userWalletAddress","vestAddress"]
   })
   
   if (!_.isEmpty(vestingAddresses)) {
      // iterate vesting addresses
      for (var m = 0; m < vestingAddresses.length; m++) {
         var vestingAddress = vestingAddresses[m];
         
      }
   } */

   // if yes, its exist we can push it on queue. this will trigger after 60 seconds.
   const derivedBeneficiary = beneficiary[0].beneficiaryAddress;
   const vestAddress = beneficiary[0].vestAddress;
   const claimTokens = beneficiary[0].claimTokens;

   await addBeneficiaryQueue.add(
      { derivedBeneficiary, vestAddress, claimTokens },
      {
         delay: 60 * 1000, // in 1 minuates
         attempts: 2,
         backoff: 5,
      }
   );

   res.status(200).json({
      code: 200,
      message: "Job Added!",
   });
});

app.post("/pause-queue", async (req, res) => {});

// if no route found
app.use(function (req, res, next) {
   logger.error(`BAD_REQUEST: one bad request found from ${req.ip}`);
   res.status(400).json({
      code: 400,
      message: "BAD_REQUEST:: no route found.",
   });
});

app.listen(PORT, async () => {
   logger.info(`Queue server running at ${PORT}`);
});
