import { Connection, clusterApiUrl, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { initializeKeypair } from './initializeKeypair';
import * as token from '@solana/spl-token';
import {
  bundlrStorage,
  findMetadataPda,
  keypairIdentity,
  Metaplex,
  toMetaplexFile
} from '@metaplex-foundation/js';
import {
  DataV2,
  createCreateMetadataAccountV2Instruction
} from '@metaplex-foundation/mpl-token-metadata';
import { readFileSync, writeFileSync } from 'fs';

const TOKEN_NAME = "CHARACTOOR XP";
const TOKEN_SYMBOL = "CXP";
const TOKEN_DESCRIPTION = "Charactoor Experience";
const TOKEN_IMAGE_PATH = "tokens/cxp/assets/cxp.png";
const TOKEN_IMAGE_NAME = "cxp.png";

const createCxpToken = async (
  connection: Connection,
  payer: Keypair
) => {
  const tokenMint = await token.createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    2
  );

  const metaplex = Metaplex
    .make(connection)
    .use(keypairIdentity(payer))
    .use(bundlrStorage({ 
      address: "https://devnet.bundlr.network", 
      providerUrl: "https://api.devnet.solana.com", 
      timeout: 60000 
    }));
  const imageBuffer = readFileSync(TOKEN_IMAGE_PATH);
  const file = toMetaplexFile(imageBuffer, TOKEN_IMAGE_NAME);
  const imageUri = await metaplex.storage().upload(file);

  const {uri } = await metaplex
    .nfts()
    .uploadMetadata({
      name: TOKEN_NAME,
      description: TOKEN_DESCRIPTION,
      image: imageUri
    })
    .run();

  const metadataPda =  findMetadataPda(tokenMint);

  const tokenMetadata: DataV2 = {
    name: TOKEN_NAME,
    symbol: TOKEN_SYMBOL,
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null
  }

  const instruction = createCreateMetadataAccountV2Instruction(
    {
      metadata: metadataPda,
      mint: tokenMint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey
    },
    {
      createMetadataAccountArgsV2: {
        data: tokenMetadata,
        isMutable: true
      }
    }
  );

  const transaction = new Transaction();
  transaction.add(instruction);

  const txSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
  );

  // write it out to file
  writeFileSync(
    "tokens/cxp/cache.json",
    JSON.stringify({
      mint: tokenMint.toBase58(),
      imageUri,
      metadataUri: uri,
      tokenMetadata: metadataPda.toBase58(),
      metadataTransaction: txSignature
    })
  )
}

const main = async () => {
  const connection = new Connection(clusterApiUrl('devnet'));
  const payer = await initializeKeypair(connection);

  await createCxpToken(connection, payer);
}

main()
  .then(() => {
    console.log('finished successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

