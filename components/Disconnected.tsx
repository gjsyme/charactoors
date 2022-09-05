import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Button, Container, Heading, HStack, VStack, Text } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { FC, MouseEventHandler, useCallback } from 'react';

const Disconnected: FC = () => {
  const modalState = useWalletModal();
  const { wallet, connect } = useWallet();

  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      if(event.defaultPrevented) return;

      if (!wallet) {
        modalState.setVisible(true);
      } else {
        connect().catch();
      }
    }, 
    [wallet, connect, modalState]
  );

  return (
    <Container>
      <VStack spacing={20}>
        <Heading 
          color="white" 
          as="h1" 
          size="2xl" 
          noOfLines={2} 
          textAlign="center"
        >
          Mint your Charactoor. Earn $XP. Level Up.
        </Heading>
        <Button bgColor="accent" color="white" maxW="380px" onClick={handleClick}>
          <HStack>
            <Text>Become a Charactoor</Text>
            <ArrowForwardIcon/>
          </HStack>
        </Button>
      </VStack>
    </Container>
  );
}

export default Disconnected;