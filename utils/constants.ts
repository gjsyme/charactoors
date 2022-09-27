// import { Keypair, PublicKey } from "@solana/web3.js"
// import * as fs from "fs"

// const string = fs.readFileSync(
//   "../target/deploy/solana_nft_staking_program-keypair.json",
//   "utf8"
// )
// const secret = Uint8Array.from(JSON.parse(string) as number[])
// const secretKey = Uint8Array.from(secret)

// export const PROGRAM_ID = Keypair.fromSecretKey(secretKey).publicKey;
import { PublicKey } from "@solana/web3.js";

// jump back 43:09
export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_STAKE_PROGRAM_ID ?? '');
export const STAKE_MINT = new PublicKey(process.env.NEXT_PUBLIC_STAKE_MINT_ADDRESS ?? '');