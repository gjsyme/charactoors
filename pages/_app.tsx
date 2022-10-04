import type { AppProps } from 'next/app'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import WalletContextProvider from '../components/WalletContextProvider';
import { WorkspaceProvider } from '../components/WorkspaceProvider';

const colors = {
  background: '#1f1f1f',
  accent: '#833BBE',
  bodyText: 'rgba(255,255,255,0.75)',
  secondaryPurple: 'CB8CFF',
  containerBg: 'rgba(255, 255, 255, 0.1)',
  containerBgSecondary: 'rgba(255, 255, 255, 0.05)',
  buttonGreen: '#7effa7'
}

const theme = extendTheme({ colors });

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <WalletContextProvider>
      <WorkspaceProvider>
        <ChakraProvider theme={theme}>
          <Component {...pageProps} />
        </ChakraProvider>
      </WorkspaceProvider>
    </WalletContextProvider>
  )
}
export default MyApp
