import { parseUnits } from "@ethersproject/units";
import { logger } from "./logger";
import { adminSigner, book, estimatedGasPrice } from "./helpers";

export async function addBeneficiary(
   beneficiaryAddresses: string,
   vestAddresses: string,
   claimTokens: string
) {
   try {
      const gasLimit = await book
         .connect(adminSigner)
         .estimateGas.multiActivation(
            beneficiaryAddresses,
            vestAddresses,
            claimTokens
         );
         
      const gasPrice = await estimatedGasPrice();

      const transaction = await book
         .connect(adminSigner)
         .multiActivation(beneficiaryAddresses, vestAddresses, claimTokens, {
            gasLimit: String(gasLimit),
            gasPrice,
         });

      const receipt = await transaction.wait(3);
      logger.info(`TX_CONFIRMED: receipt hash- ${receipt.transactionHash}`);
      return receipt;
   } catch (error) {
      logger.error(`TX_FAILED: ${error.message}`);
      throw new Error("some unexpected error");
   }
}
