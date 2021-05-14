import { parseUnits } from "@ethersproject/units";
import { logger } from "./logger";
import { DEFAULT_VEST } from "./constants";
import { adminSigner, book } from "./helpers";

export async function addBeneficiary(
   beneficiaryAddress: string,
   vestAddress: string,
   claimTokens: number
) {
   try {
      const totalClaimable = parseUnits(String(claimTokens), "ether");

      const transaction = await book
         .connect(adminSigner)
         .singleActivation(beneficiaryAddress, vestAddress, totalClaimable, {
            gasLimit: 800000,
         });

      const receipt = await transaction.wait(3);
      logger.info(`TX_CONFIRMED: receipt hash- ${receipt.transactionHash}`);
   } catch (error) {
      logger.error(`TX_FAILED: ${error.message}`);
      throw new Error("some unexpected error");
   }
}
