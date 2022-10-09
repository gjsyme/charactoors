import { 
  Center,
  Heading, 
  VStack, 
  Text, 
  HStack,
  Flex, 
  Image, 
  SimpleGrid
} from "@chakra-ui/react";
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { NextPage } from "next";
import { useCallback, useEffect, useRef, useState } from 'react';
import { LootBox } from "../components/LootBox";
import { GearItem } from "../components/GearItem";
import MainLayout from "../components/MainLayout";
import { StakeOptionsDisplay } from "../components/StakeOptionsDisplay";
import { useWorkspace } from "../components/WorkspaceProvider";
import { getStakeAccount } from "../utils/accounts";
import { GEAR_OPTIONS } from "../utils/constants";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";


interface StakeProps {
  mint: PublicKey,
  imageSrc: string
};

const Stake: NextPage<StakeProps> = ({
  mint,
  imageSrc
}) => {
  // const [isStaking, setIsStaking] = useState(false);
  const [stakeAccount, setStakeAccount] = useState<any>();
  const [nftTokenAccount, setNftTokenAccount] = useState<PublicKey>()
  const [gearBalances, setGearBalances] = useState<any>({});
  const [nftData, setNftData] = useState<any>();

  const { connection } = useConnection();
  const walletAdapter = useWallet();
  const { stakingProgram } = useWorkspace();

  useEffect(() => {
    loadNftData();
  }, [connection, walletAdapter]);

  const loadNftData = async () => {
    const metaplex = Metaplex.make(connection).use(
      walletAdapterIdentity(walletAdapter)
    );

    const safeMint = (typeof mint==='string') ? new PublicKey(mint) : mint;

    const nft = await metaplex
      .nfts()
      .findByMint({ mintAddress: safeMint })
      .run();

    setNftData(nft);
    fetchState(nft.mint.address);
  }

  const fetchState = useCallback(
    async (mint: PublicKey) => {
      try {
        if (!walletAdapter.publicKey) {
          return
        }

        const tokenAccount = (await connection.getTokenLargestAccounts(mint))
          .value[0]
          .address;

        setNftTokenAccount(tokenAccount)

        const account = await getStakeAccount(
          stakingProgram,
          walletAdapter.publicKey,
          tokenAccount
        );

        setStakeAccount(account);

        let balances: any = {}
        for (let i = 0; i < GEAR_OPTIONS.length; i++) {
          const gearMint = GEAR_OPTIONS[i]
          const ata = await getAssociatedTokenAddress(
            gearMint,
            walletAdapter.publicKey
          )
          try {
            const account = await getAccount(connection, ata)
            balances[gearMint.toBase58()] = Number(account.amount)
          } catch {}
        }

        setGearBalances(balances)
      } catch (e) {
        console.log("error getting stake account:", e)
      }
    },
    [connection, walletAdapter, stakingProgram]
  )

  return (
    <MainLayout>
      <VStack 
        align="flex-start" 
        spacing={7} 
        justify="flex-start"
      >
        <Heading color="white" as="h1" size="2xl">
          Level up your Charactoor
        </Heading>
        <Text color="bodyText" fontSize="xl" textAlign="start" maxW="600px">
          Stake your Charactoor to earn $10 CXP per day to get access to a randomized loot box full of upgrades for your Charactoor
        </Text>
        <HStack spacing={20} alignItems="flex-start">
          <VStack align="flex-start" minW="200px">
            <Flex direction="column">
              <Image src={imageSrc ?? ''} alt="charactoor nft" zIndex={1} />
              <Center 
                bgColor="secondaryPurple" 
                borderRadius="0 0 8px 8px"
                marginTop="-8px"
                zIndex="2"
                height="32px"
              >
                <Text 
                  color="white" 
                  as="b" 
                  fontSize="md" 
                  width="100%" 
                  textAlign="center"
                >
                  {stakeAccount?.stakeState.staked ? "STAKING" : "UNSTAKED"}
                </Text>
              </Center>
            </Flex>
          </VStack>
          <VStack alignItems="flex-start" spacing={10}>
            <StakeOptionsDisplay
              stakeAccount={stakeAccount}
              fetchState={fetchState}
              nftData={nftData}
            />
            <HStack spacing={10} align="start">
              {Object.keys(gearBalances).length > 0 && (
                <VStack alignItems="flex-start">
                  <Text color="white" as="b" fontSize="2xl">
                    Gear
                  </Text>
                  <SimpleGrid
                    columns={Math.min(2, Object.keys(gearBalances).length)}
                    spacing={3}
                  >
                    {Object.keys(gearBalances).map((key, _) => {
                      return (
                        <GearItem
                          item={key}
                          balance={gearBalances[key]}
                          key={key}
                        />
                      )
                    })}
                  </SimpleGrid>
                </VStack>
              )}
              <VStack alignItems="flex-start">
                <Text color="white" as="b" fontSize="2xl">
                  Loot Box
                </Text>
                <HStack>
                  {nftData && nftTokenAccount && (
                    <LootBox
                      stakeAccount={stakeAccount}
                      nftTokenAccount={nftTokenAccount}
                      fetchUpstreamState={() => {
                        fetchState(nftData.mint.address)
                      }}
                    />
                  )}
                </HStack>
              </VStack>
            </HStack>
          </VStack>
          
        </HStack>
      </VStack>
    </MainLayout>
  )
};

export default Stake;

// hack to force/allow the image to be just a string not string[]|string
Stake.getInitialProps = async ({ query }: any) => {
  const { mint, imageSrc } = query;

  if(!mint || !imageSrc) throw { error: 'no mint' };

  try{
    const mintPubKey = new PublicKey(mint);
    return {mint: mintPubKey, imageSrc }
  }catch{
    throw { error: 'invalid mint' };
  }
}