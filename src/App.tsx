import { GameInterface } from '@/components/GameInterface';
import { SolanaWalletProvider } from '@/components/WalletProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Leaderboard from '@/pages/leaderboard';

function App() {
    return (
        <SolanaWalletProvider>
            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<GameInterface />} />
                    <Route path='/leaderboard' element={<Leaderboard />} />
                </Routes>
            </BrowserRouter>
            <Toaster />
        </SolanaWalletProvider>
    );
}

export default App;
