import { Button, Text, VStack } from "@chakra-ui/react";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { PROGRAM_ID, STAKE_MINT } from "../utils/constants";
import { createInitializeStakeAccountInstruction, createRedeemInstruction, createStakingInstruction, createUnstakeInstruction } from "../utils/instructions";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { getStakeAccount } from "../utils/accounts";

interface StakeOptionsDisplayProps {
  nftData: { address: PublicKey, mint: { address: PublicKey}, edition: { address: PublicKey }};
  isStaked: boolean;
  daysStaked: number;
  totalEarned: number;
  claimable: number;
};

export const StakeOptionsDisplay = (props: StakeOptionsDisplayProps) => {
  const {
    nftData,
    isStaked, 
    daysStaked,
    totalEarned,
    claimable
  } = props;
  const walletAdapter = useWallet();
  const { connection } = useConnection();

  const [isStaking, setIsStaking] = useState(isStaked);
  const [nftTokenAccount, setNftTokenAccount] = useState<PublicKey>();

  useEffect(() => {
    checkStakingStatus();
    console.log('effect called with',nftData);
    // looks weird, but we're looking for the only account that holds
    // as there is only 1 total
    if(nftData){
      connection.getTokenLargestAccounts(nftData.mint.address)
      .then((accounts) => {
        console.log('holders',accounts);
        setNftTokenAccount(accounts.value[0].address) 
      })
    }
  }, [nftData, walletAdapter, connection]);

  const checkStakingStatus = useCallback(async() => {
    if(!walletAdapter.publicKey || !nftTokenAccount) return;

    try{
      const account = await getStakeAccount(
        connection,
        walletAdapter.publicKey,
        nftTokenAccount
      );

      // state zero is staked
      setIsStaking(account.state === 0);
    }catch(e){
      console.log('error:', e);
    }
  }, [walletAdapter, connection, nftTokenAccount]);

  const sendAndConfirmTransaction = useCallback(
    async (
      transaction: Transaction
    ) => {
      try{
        const txSignature = await walletAdapter.sendTransaction(transaction, connection);

        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          {
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: txSignature
          },
          "finalized"
        );
      }catch(e){
        console.error('error', e);
      }
      await checkStakingStatus();
    }, [walletAdapter, connection]
  );

  const handleClaim = useCallback(async () => {
    if (!walletAdapter.connected || !walletAdapter.publicKey) {
      alert('please connect your wallet');
      return;
    }
    if(!nftTokenAccount){
      alert('no nftTokenAccount');
      return;
    }

    // check for user ATA
    const userStakeATA = await getAssociatedTokenAddress(
      STAKE_MINT,
      walletAdapter.publicKey
    );

    const account = await connection.getAccountInfo(userStakeATA);
    const transaction = new Transaction();
    // if ata doesn't exist, create one
    if(!account){
      transaction.add(
        createAssociatedTokenAccountInstruction(
          walletAdapter.publicKey,
          userStakeATA,
          walletAdapter.publicKey,
          STAKE_MINT
        )
      );
    }
    // in either case make the redeem
    transaction.add(
      createRedeemInstruction(
        walletAdapter.publicKey,
        nftTokenAccount,
        nftData.mint.address,
        userStakeATA,
        TOKEN_PROGRAM_ID,
        PROGRAM_ID
      )
    );

    await sendAndConfirmTransaction(transaction);
  }, [walletAdapter, connection]);

  const handleStake = useCallback(async () => {
    if (!walletAdapter.connected || !walletAdapter.publicKey) {
      alert('please connect your wallet');
      return;
    }
    if(!nftTokenAccount){
      alert('invalid nftTokenAccount');
      return;
    }

    const [stakeAccount] = PublicKey.findProgramAddressSync(
      [walletAdapter.publicKey.toBuffer(), nftTokenAccount.toBuffer()],
      PROGRAM_ID
    );

    const transaction = new Transaction();

    const account = await connection.getAccountInfo(stakeAccount);
    if(!account){
      transaction.add(
        createInitializeStakeAccountInstruction(
          walletAdapter.publicKey,
          nftTokenAccount,
          PROGRAM_ID
        )
      );
    }

    const stakeInstruction = createStakingInstruction(
      walletAdapter.publicKey,
      nftTokenAccount,
      nftData.mint.address,
      nftData.edition.address,
      TOKEN_PROGRAM_ID,
      METADATA_PROGRAM_ID,
      PROGRAM_ID  //this may be wrong, see ~10:30 in video
    );

    transaction.add(stakeInstruction);
    await sendAndConfirmTransaction(transaction);

  }, [walletAdapter, connection]);

  const handleUnstake = useCallback(async () => {
    if (!walletAdapter.connected || !walletAdapter.publicKey) {
      alert('please connect your wallet');
      return;
    }
    if(!nftTokenAccount){
      alert('no nftTokenAccount');
      return;
    }

    // check for user ATA
    const userStakeATA = await getAssociatedTokenAddress(
      STAKE_MINT,
      walletAdapter.publicKey
    );
    console.log('user ata', userStakeATA.toBase58());

    const account = await connection.getAccountInfo(userStakeATA);
    const transaction = new Transaction();
    // if ata doesn't exist, create one
    if(!account){
      transaction.add(
        createAssociatedTokenAccountInstruction(
          walletAdapter.publicKey,
          userStakeATA,
          walletAdapter.publicKey,
          STAKE_MINT
        )
      );
    }

    // now include the other stuff
    transaction.add(
      createUnstakeInstruction(
        walletAdapter.publicKey,
        nftTokenAccount,
        nftData.address,
        nftData.edition.address,
        STAKE_MINT,
        userStakeATA,
        TOKEN_PROGRAM_ID,
        METADATA_PROGRAM_ID,
        PROGRAM_ID
      )
    );

    await sendAndConfirmTransaction(transaction);
  }, [walletAdapter, connection]);

  return (
    <VStack 
      bgColor="containerBg" 
      borderRadius={"20px"}
      p="20px 40px"
      spacing={5}
    >
      <Text 
        bgColor="containerBgSecondary" 
        padding="4px 8px"
        borderRadius="20px"
        color="bodyText"
        as="b"
        fontSize="sm"
      >
        { isStaking ? 
          `STAKING ${daysStaked} DAY${daysStaked===1 ? '' : 'S'}` :
          `READY TO STAKE`
        }
      </Text>
      <VStack spacing="-1">
        <Text color="white" as="b" fontSize="4xl">
          { isStaking ? `${totalEarned} $CXP` : `0 $CXP`}
        </Text>
        <Text color="bodyText">
          {isStaking ? `${claimable} $CXP earned` : `earn $CXP by staking`}
        </Text>
      </VStack>
      <Button 
        onClick={isStaking ? handleClaim : handleStake}
        backgroundColor="buttonGreen"  
        w="200px"
      >
        {isStaking ? 'claim $CXP' : 'stake charactoor'}
      </Button>
      { isStaking && <Button onClick={handleUnstake}>unstake</Button> }
    </VStack>
  );
}