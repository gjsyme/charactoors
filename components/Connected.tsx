import { Button, Container, Heading, HStack, Image, VStack, Text } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { FC } from 'react';

const Connected: FC = () => {


  return (
    <VStack spacing={20}>
      <Container>
        <VStack spacing={8}>
          <Heading color="white" as="h1" size="2xl" noOfLines={1} textAlign="center">
            Welcome Charactoor.
          </Heading>
          <Text color="bodyText" fontSize="xl" textAlign="center">
            Each Charactoor is randomly generated and can be staked to receive&nbsp;
            <Text as="b">$XP</Text>
            . Use your&nbsp;
            <Text as="b">$XP</Text> to
            upgrade your charactoor and receive perks in the community!
          </Text>
        </VStack>
      </Container>

      <HStack>
        {/* have to do some images */}
        <Image src="avatar1.png" alt="" />
        <Image src="avatar2.png" alt="" />
        <Image src="avatar3.png" alt="" />
        <Image src="avatar4.png" alt="" />
        <Image src="avatar5.png" alt="" />
      </HStack>

      <Button bgColor="accent" color="white" maxW="380px">
        <Text>Mint Charactoor</Text>
      </Button>
    </VStack>
  );
}

export default Connected;