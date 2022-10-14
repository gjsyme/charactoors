import { Box, Button, Container, Heading, HStack, Icon, VStack, Text } from '@chakra-ui/react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { FC, MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { FaUserNinja, FaUserAlt, FaUserAstronaut } from 'react-icons/fa';
import { PublicKey } from '@solana/web3.js';
import { 
  Metaplex,
  walletAdapterIdentity,
  CandyMachine
} from '@metaplex-foundation/js';
import { useEffect } from 'react';
import { useRouter } from 'next/router';


const Connected: FC = () => {
  const { connection } = useConnection();
  const walletAdapter = useWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();
  const [isMinting, setIsMinting] = useState(false);
  const router = useRouter();

  const metaplex = useMemo(() => {
    return Metaplex.make(connection).use(walletAdapterIdentity(walletAdapter));
  }, [connection, walletAdapter]);

  useEffect(() => {
    if(!metaplex) return;
    metaplex
      .candyMachines()
      .findByAddress({
        address: new PublicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_ADDRESS ?? '')
      })
      .run()
      .then((candyMachine) => {
        // console.log('candy machine', candyMachine);
        setCandyMachine(candyMachine);
      })
      .catch((err) => {
        alert(err);
      });
  }, [metaplex]);

  const handleMint: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (event) => {
      console.log('event', event);
      // weird event
      if(event.defaultPrevented) return;
      // bad web3 setup
      if(!walletAdapter.connect || !candyMachine) return;
      try{
        setIsMinting(true);
        const nft = await metaplex
          .candyMachines()
          .mint({ candyMachine })
          .run();

        console.log('nft', nft);
        router.push(`/new-mint?mint=${nft.nft.address}`);
      }catch(err){
        console.error('error minting', err);
      } finally {
        // turn it off on success or error
        setIsMinting(false);
      }
    }, 
    [
      metaplex,
      walletAdapter,
      candyMachine
    ]
  );

  return (
    <VStack spacing={20}>
      <Container>
        <VStack spacing={8}>
          <Heading color="white" as="h1" size="2xl" noOfLines={1} textAlign="center">
            Welcome Charactoor.
          </Heading>
          <Text color="bodyText" fontSize="xl" textAlign="center">
            Each Charactoor is randomly generated and can be staked to receive&nbsp;
            <Text as="b">$CXP</Text>
            . Use your&nbsp;
            <Text as="b">$CXP</Text> to
            upgrade your charactoor and receive perks in the community!
          </Text>
        </VStack>
      </Container>

      <HStack>
        {/* have to do some images */}
        <Icon as={FaUserNinja} h={12} w={12} color="#833BBE"/>
        <Icon as={FaUserAstronaut} h={12} w={12} color="#833BBE"/>
        <Icon as={FaUserAlt} h={12} w={12} color="#833BBE"/>

      </HStack>

      <Button bgColor="accent" color="white" maxW="380px" onClick={handleMint} isLoading={isMinting}>
        <Text>Mint Charactoor</Text>
      </Button>
    </VStack>
  );
}

export default Connected;