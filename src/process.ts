import { parseUnits } from "@ethersproject/units";
import { logger } from "./logger";
import { adminSigner, book, estimatedGasPrice } from "./helpers";

export async function addBeneficiary(
   beneficiaryAddress: string,
   vestAddress: string,
   claimTokens: string
) {
   try {
      const gasLimit = await book
         .connect(adminSigner)
         .estimateGas.singleActivation(
            beneficiaryAddress,
            vestAddress,
            claimTokens
         );
      const gasPrice = await estimatedGasPrice();

      const transaction = await book
         .connect(adminSigner)
         .singleActivation(beneficiaryAddress, vestAddress, claimTokens, {
            gasLimit,
            gasPrice,
         });

      const receipt = await transaction.wait(3);
      logger.info(`TX_CONFIRMED: receipt hash- ${receipt.transactionHash}`);
   } catch (error) {
      logger.error(`TX_FAILED: ${error.message}`);
      throw new Error("some unexpected error");
   }
}
