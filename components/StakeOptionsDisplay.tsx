import { Button, Text, VStack } from "@chakra-ui/react";
import { Account, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { STAKE_MINT } from "../utils/constants";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { StakeAccount } from "../utils/accounts";
import { useWorkspace } from "./WorkspaceProvider";

interface StakeOptionsDisplayProps {
  nftData: { address: PublicKey, mint: { address: PublicKey}, edition: { address: PublicKey }};
  stakeAccount?: StakeAccount;
  fetchState: (mint: PublicKey) => Promise<void>
};

export const StakeOptionsDisplay = (props: StakeOptionsDisplayProps) => {
  const {
    nftData,
    fetchState,
    stakeAccount
  } = props;
  const walletAdapter = useWallet();
  const { connection } = useConnection();
  const [nftTokenAccount, setNftTokenAccount] = useState<PublicKey>();
  const [cxpTokenAccount, setCxpTokenAccount] = useState<Account>();
  const [isConfirmingTransaction, setIsConfirmingTransaction] = useState(false);

  const workspace = useWorkspace();

  useEffect(() => {
    // looks weird, but we're looking for the only account that holds
    // as there is only 1 total
    console.log('nftData', nftData);
    if(nftData){
      connection
        .getTokenLargestAccounts(nftData.mint.address)
        .then((accounts) => setNftTokenAccount(accounts.value[0].address));
    }
    if (walletAdapter.publicKey) {
      getTokenAccount(walletAdapter.publicKey, connection);
    }
  }, [nftData, walletAdapter, connection]);

  const getTokenAccount = async (
    publicKey: PublicKey,
    connection: Connection
  ) => {
    try {
      const ata = await getAssociatedTokenAddress(STAKE_MINT, publicKey);
      console.log('ata', ata.toBase58());
      const account = await getAccount(connection, ata);
      console.log('account', account.address.toBase58());
      setCxpTokenAccount(account);
    }catch(err){
      console.log('error in getTokenAccount', err);
    }
  }

  const sendAndConfirmTransaction = useCallback(
    async (
      transaction: Transaction
    ) => {
      setIsConfirmingTransaction(true);

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

        await getTokenAccount(walletAdapter.publicKey!, connection);
        if(nftData){
          await fetchState(nftData.mint.address);
        }
      }catch(e){
        console.error('error', e);
      }finally{
        setIsConfirmingTransaction(false);
      }
    }, [walletAdapter, connection]
  );

  const handleClaim = useCallback(async () => {
    if (!walletAdapter.connected || !walletAdapter.publicKey || !workspace.stakingProgram) {
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
        .stakingProgram
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

  const daysStaked = useMemo(() => {
    return stakeAccount?.daysStaked() ?? 0
  }, [stakeAccount]);

  const handleStake = useCallback(async () => {
    if (
        !walletAdapter.connected || 
        !walletAdapter.publicKey || 
        !workspace.stakingProgram
      ) {
      alert('please connect your wallet');
      return;
    }
    if(!nftTokenAccount){
      alert('invalid nftTokenAccount');
      return;
    }

    const transaction = new Transaction();

    transaction.add(
      await workspace.stakingProgram
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
    if (!walletAdapter.connected || !walletAdapter.publicKey || !workspace.stakingProgram) {
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
        .stakingProgram
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
        { stakeAccount?.stakeState.staked ? 
          `STAKING ${daysStaked} DAY${daysStaked===1 ? '' : 'S'}` :
          `READY TO STAKE`
        }
      </Text>
      <VStack spacing="-1">
        <Text color="white" as="b" fontSize="4xl">
          {`${Number(cxpTokenAccount?.amount ?? 0) / Math.pow(10, 2)} $CXP`}
        </Text>
        <Text color="bodyText">
          {stakeAccount?.stakeState.staked ? `${stakeAccount?.claimable()} $CXP earned` : `earn $CXP by staking`}
        </Text>
      </VStack>
      <Button 
        onClick={stakeAccount?.stakeState.staked ? handleClaim : handleStake}
        backgroundColor="buttonGreen"  
        w="200px"
        isLoading={isConfirmingTransaction}
      >
        {stakeAccount?.stakeState.staked ? 'claim $CXP' : 'stake charactoor'}
      </Button>
      { stakeAccount?.stakeState.staked && <Button onClick={handleUnstake} isLoading={isConfirmingTransaction}>unstake</Button> }
    </VStack>
  );
}