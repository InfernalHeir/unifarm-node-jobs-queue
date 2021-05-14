import { JsonRpcProvider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import UFARMBenenficiaryBook from "../constants/abi/UFARMBeneficiaryBook.json";
import {
   beneficiaryServerEndpoint,
   UFARMBeneficiaryBookAddress,
} from "../constants";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { Wallet } from "@ethersproject/wallet";
import { Promise } from "bluebird";

/// @base-dir getting root.
export const __baseDir = process.env.PWD;

/// load env file
dotenv.config({ path: `${__baseDir}/.env.${process.env.NODE_ENV}` });

const RPC_URL = process.env.RPC_URL;

const ADMIN_PRIVATE_KEY: string = <string>process.env.ADMIN_PRIVATE_KEY;

export const provider = new JsonRpcProvider(RPC_URL);
// get beneficiary book contract instance

export const book = new Contract(
   UFARMBeneficiaryBookAddress,
   UFARMBenenficiaryBook,
   provider
);

export const benficiaryDetails = async (account: string) => {
   const fetchBeneficiary = await fetch(
      `${beneficiaryServerEndpoint}?msgSender=${account}`
   );
   const beneficiary = await fetchBeneficiary.json();
   return beneficiary.data;
};

export const adminSigner = new Wallet(ADMIN_PRIVATE_KEY, provider);

// it will search if he is beneficiary already.
export const getBeneficiaryCount = async (account: string): Promise<number> => {
   const beneficiaryActivationCount = await book.beneficiaryActivationCount(
      account
   );
   return Number(beneficiaryActivationCount);
};

// get beneficiary details
export const getBenficiaryFromSmartContract = async (account: string) => {
   var registered: any[] = [];

   const noOfVestRegistration = await getBeneficiaryCount(account);
   if (noOfVestRegistration === 0) return [];

   for (var m = 0; m < noOfVestRegistration; m++) {
      registered.push(book.beneficiaries(account, m));
   }

   const accmulatedRegistrations = await Promise.all(registered).then(
      (values) => {
         var vestingAddress: string[] = [];
         for (var v = 0; v < values.length; v++) {
            vestingAddress.push(values[v][1]);
         }
         return vestingAddress;
      }
   );

   return accmulatedRegistrations;
};
