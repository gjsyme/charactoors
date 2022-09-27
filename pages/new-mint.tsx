import type { NextPage } from 'next';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import MainLayout from '../components/MainLayout';
import { Button, Container, Heading, HStack, Image, Text, VStack } from '@chakra-ui/react';
import { MouseEventHandler, useState } from 'react';
import { useCallback } from 'react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { PublicKey } from '@solana/web3.js';
import { useEffect } from 'react';
import { useMemo } from 'react';
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { Router, useRouter } from 'next/router';

interface NewMintProps {
  mint: PublicKey
}

const NewMint: NextPage<NewMintProps> = ({ mint }: NewMintProps) => {
  const { connected } = useWallet();
  const [metadata, setMetaData] = useState<any>();
  const { connection } = useConnection();
  const walletAdapter = useWallet();

  const metaplex = useMemo(() => {
    return Metaplex.make(connection).use(walletAdapterIdentity(walletAdapter));
  }, [connection, walletAdapter]);

  useEffect(() => {
    if(!mint) return;
    console.log('effect mint type', typeof mint);
    lookupNftData();
  }, [mint, metaplex, walletAdapter]);

  const lookupNftData = async () => {
    const safeMint = (typeof mint==='string') ? new PublicKey(mint) : mint;
    try{
      const nft = await metaplex
        .nfts()
        .findByMint({ mintAddress: safeMint })
        .run();
        
      const nftUriData = await fetch(nft.uri);
      const nftJson = await nftUriData.json();
      setMetaData(nftJson);
    }catch(err){
      console.error('error fetching nft data', err);
    }
  }

  const router = useRouter();
  
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (event) => {
      router.push(`/stake?mint=${mint}&imageSrc=${metadata?.image}`);
    }, [router, mint, metadata]);
  
  return (
    <MainLayout>
      <VStack spacing={20}>
        <Container>
          <VStack spacing={0}>
            <Heading color="white" as="h1" size="2xl" textAlign="center">
              A new Charactoor has arrived!
            </Heading>

            <Text color="bodyText" fontSize="xl" textAlign="center">
              Contratulations, you have minted a lvl 1 charactoor!
              <br/>
              Time to stake your charactoor to level them up!
            </Text>
            { metadata && <Image src={metadata?.image ?? ''} alt={metadata?.description ?? 'Charactoor'} /> }

            <Button bgColor="accent" color="white" maxW="380px" onClick={handleClick}>
              <HStack>
                <Text>Stake my Charactoor</Text>
                <ArrowForwardIcon/>
              </HStack>
            </Button>
          </VStack>
        </Container>
      </VStack>
    </MainLayout>
  );
}

NewMint.getInitialProps =  async ({ query }) => {
  const { mint } = query;

  if(!mint) throw { error: 'no mint' };

  try{
    const mintPubKey = new PublicKey(mint);
    console.log(mintPubKey);
    return {
      mint: mintPubKey
    }
  }catch(err){
    throw { error: 'invalid mint' };
  }
}

export default NewMint;