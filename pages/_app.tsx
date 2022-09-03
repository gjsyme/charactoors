import type { AppProps } from 'next/app'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import WalletContextProvider from '../components/WalletContextProvider';

const colors = {
  background: '#1f1f1f',
  accent: '#833BBE',
  bodyText: 'rgba(255,255,255,0.75)'
}

const theme = extendTheme({ colors });

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <WalletContextProvider>
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </WalletContextProvider>
  )
}
export default MyApp
