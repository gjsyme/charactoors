import { 
  Center,
  Heading, 
  VStack, 
  Text, 
  HStack,
  Flex, 
  Image 
} from "@chakra-ui/react";
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { NextPage } from "next";
import { useEffect, useRef, useState } from 'react';
import { ItemBox } from "../components/ItemBox";
import MainLayout from "../components/MainLayout";
import { StakeOptionsDisplay } from "../components/StakeOptionsDisplay";


interface StakeProps {
  mint: PublicKey,
  imageSrc: string
};

const Stake: NextPage<StakeProps> = ({
  mint,
  imageSrc
}) => {
  const [isStaking, setIsStaking] = useState(false);
  const [level, setLevel] = useState(1);
  const [nftData, setNftData] = useState<any>();
  const { connection } = useConnection();
  const walletAdapter = useWallet();

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
  }

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
                  {isStaking ? "STAKING" : "UNSTAKED"}
                </Text>
              </Center>
            </Flex>
            <Text fontSize="2xl" as="b" color="white">
              LEVEL {level}
            </Text>
          </VStack>
          <VStack alignItems="flex-start" spacing={10}>
            <StakeOptionsDisplay
              isStaked={isStaking}
              daysStaked={4}
              totalEarned={107}
              claimable={42}
              nftData={nftData}
            />
            <HStack spacing={10}>
              <VStack alignItems="flex-start">
                <Text color="white" as="b" fontSize="2xl">
                  Gear
                </Text>
                <HStack>
                  <ItemBox>mock</ItemBox>
                  <ItemBox>alternate</ItemBox>
                </HStack>
              </VStack>
              <VStack alignItems="flex-start">
                <Text color="white" as="b" fontSize="2xl">
                  Loot Boxes
                </Text>
                <HStack>
                  <ItemBox>mock</ItemBox>
                  <ItemBox>alternate</ItemBox>
                  <ItemBox>third</ItemBox>
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