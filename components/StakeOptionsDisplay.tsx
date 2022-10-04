import { Button, Text, VStack } from "@chakra-ui/react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { STAKE_MINT } from "../utils/constants";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { getStakeAccount } from "../utils/accounts";
import { useWorkspace } from "./WorkspaceProvider";

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

  const workspace = useWorkspace();

  useEffect(() => {
    // checkStakingStatus();
    // looks weird, but we're looking for the only account that holds
    // as there is only 1 total
    if(nftData){
      console.log('effect called with',nftData);

      connection.getTokenLargestAccounts(nftData.mint.address)
      .then((accounts) => {
        console.log('holders',accounts.value[0].address);
        setNftTokenAccount(accounts.value[0].address) 
      })
    }
  }, [nftData, walletAdapter, connection]);

  const checkStakingStatus = useCallback(async() => {
    console.log('checking stake status',
      walletAdapter.publicKey, 
      nftTokenAccount, 
      workspace.program
    );
    if(
      !walletAdapter.publicKey || 
      !nftTokenAccount || 
      !workspace.program
    ) return;

    
    try{
      const account = await getStakeAccount(
        workspace.program,
        walletAdapter.publicKey,
        nftTokenAccount
      );

      console.log('staking: ',account.stakeState.staked);

      // state zero is staked
      setIsStaking(account.stakeState.staked);
    }catch(e){
      console.log('error checking stake:', e);
    }
  }, [walletAdapter, workspace.program, connection, nftTokenAccount]);

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
    if (!walletAdapter.connected || !walletAdapter.publicKey || !workspace.program) {
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
    const transaction = new Transaction();

    transaction.add(
      await workspace
        .program
        .methods
        .redeem()
        .accounts({
          nftTokenAccount: nftTokenAccount,
          stakeMint: STAKE_MINT,
          userStakeAta: userStakeATA
        })
        .instruction()
    );

    await sendAndConfirmTransaction(transaction);
  }, [walletAdapter, connection]);

  const handleStake = useCallback(async () => {
    if (!walletAdapter.connected || !walletAdapter.publicKey || !workspace.program) {
      alert('please connect your wallet');
      return;
    }
    if(!nftTokenAccount){
      alert('invalid nftTokenAccount');
      return;
    }

    const transaction = new Transaction();

    transaction.add(
      await workspace.program
        .methods
        .stake()
        .accounts({
          nftTokenAccount: nftTokenAccount,
          nftMint: nftData.mint.address,
          nftEdition: nftData.edition.address,
          metadataProgram: METADATA_PROGRAM_ID
        })
        .instruction()
    );
    await sendAndConfirmTransaction(transaction);
  }, [walletAdapter, connection, nftData, nftTokenAccount]);

  const handleUnstake = useCallback(async () => {
    if (!walletAdapter.connected || !walletAdapter.publicKey || !workspace.program) {
      alert('please connect your wallet');
      return;
    }
    if(!nftTokenAccount){
      alert('no nftTokenAccount');
      return;
    }

    const userStakeATA = await getAssociatedTokenAddress(
      STAKE_MINT,
      walletAdapter.publicKey
    );
    const transaction = new Transaction();

    transaction.add(
      await workspace
        .program
        .methods
        .unstake()
        .accounts({
          nftTokenAccount: nftTokenAccount,
          nftMint: nftData.mint.address,
          nftEdition: nftData.edition.address,
          metadataProgram: METADATA_PROGRAM_ID,
          stakeMint: STAKE_MINT,
          userStakeAta: userStakeATA
        })
        .instruction()
    )

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