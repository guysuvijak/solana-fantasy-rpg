import { GameInterface } from '@/components/GameInterface';
import { SolanaWalletProvider } from '@/components/WalletProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Leaderboard from '@/pages/leaderboard';
import { ThemeProvider } from '@/providers/ThemeProvider';

function App() {
    return (
        <ThemeProvider>
            <SolanaWalletProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path='/' element={<GameInterface />} />
                        <Route path='/leaderboard' element={<Leaderboard />} />
                    </Routes>
                </BrowserRouter>
                <Toaster />
            </SolanaWalletProvider>
        </ThemeProvider>
    );
}

export default App;
