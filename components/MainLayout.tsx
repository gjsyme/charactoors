import { FC, ReactNode } from 'react';
import {
  Box,
  Center,
  Spacer,
  Stack
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import Head from 'next/head'

import NavBar from '../components/NavBar';
import styles from '../styles/Home.module.css'

const MainLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const { connected } = useWallet();

  return (
    <div className={styles.container}>
      <Head>
        <title>Charactoors</title>
        <meta name="The NFT collection for Charactoors"></meta>
        <link rel="icon" href="/favicon.ico"/>
      </Head>

      <Box 
        w="full" 
        h="calc(100vh)" 
        backgroundImage={connected ? "" : "url(/charactoor_background.png)"}
        backgroundPosition="center"  
      >
        <Stack w="full" h="calc(100vh)" justify="center">
          <NavBar />
          <Spacer />
          <Center>
            {/* if connected, content, otherwise external content */}
            { children }
          </Center>
          <Spacer />
          <Center>
            <Box marginBottom={4} color="white">
              <a href="https://twitter.com/gjsyme" target="_blank" rel="noopener noreferrer">By @gjsyme</a>
            </Box>
          </Center>
        </Stack>
      </Box>
    </div>
  )
}

export default MainLayout;