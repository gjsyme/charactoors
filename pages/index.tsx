import Disconnected from '../components/Disconnected';
import Connected from '../components/Connected';
import { useWallet } from '@solana/wallet-adapter-react';
import MainLayout from '../components/MainLayout';

export default function Home() {
  const { connected } = useWallet();
  return (
    <MainLayout>
      { connected ? <Connected/> : <Disconnected/> }
    </MainLayout>
  );
}
