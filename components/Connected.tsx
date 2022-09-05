import { Box, Button, Container, Heading, HStack, Icon, VStack, Text } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { FC } from 'react';
import { FaUserNinja, FaUserAlt, FaUserAstronaut } from 'react-icons/fa';

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
        <Icon as={FaUserNinja} h={12} w={12} color="#833BBE"/>
        <Icon as={FaUserAstronaut} h={12} w={12} color="#833BBE"/>
        <Icon as={FaUserAlt} h={12} w={12} color="#833BBE"/>

      </HStack>

      <Button bgColor="accent" color="white" maxW="380px">
        <Text>Mint Charactoor</Text>
      </Button>
    </VStack>
  );
}

export default Connected;