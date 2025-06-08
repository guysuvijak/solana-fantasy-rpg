// src/pages/leaderboard.tsx
import { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useMetaplexGame } from '../hooks/useMetaplexGame';
import { PlayerData } from '../types/game';
import { getCache, setCache } from '../utils/cache';

const Leaderboard = () => {
    const { loadLeaderboardData } = useMetaplexGame();
    const [leaderboard, setLeaderboard] = useState<PlayerData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expTable, setExpTable] = useState<Record<string, number>>({});

    useEffect(() => {
        if (typeof loadLeaderboardData !== 'function') return;
        const fetchLeaderboard = async () => {
            setIsLoading(true);

            const cached = getCache('leaderboard');
            if (cached) {
                setLeaderboard(cached);
                setIsLoading(false);
                return;
            }

            const data = await loadLeaderboardData();
            if (data) {
                setLeaderboard(data);
                setCache('leaderboard', data); // TTL default = 3 minutes
            }

            setIsLoading(false);
        };

        fetch('/fantasy-rpg-exp.json')
            .then((res) => res.json())
            .then((data) => setExpTable(data))
            .catch((err) => console.error('Failed to load exp table:', err));

        fetchLeaderboard();
    }, [loadLeaderboardData]);

    const getLevelFromExp = (exp: number): number => {
        const levels = Object.entries(expTable)
            .map(([level, threshold]) => ({ level: Number(level), threshold }))
            .sort((a, b) => a.level - b.level);

        for (let i = 0; i < levels.length; i++) {
            if (exp < levels[i].threshold) {
                return levels[i].level;
            }
        }

        return levels[levels.length - 1]?.level || 1;
    };

    return (
        <div className='min-h-screen flex flex-col bg-gradient-to-tr from-[#1d0000] to-[#09001f] text-white'>
            {/* Header */}
            <div className='flex sticky top-0 justify-between items-center mb-4 bg-gradient-to-b from-[#210035] to-[#16004b] px-4 md:px-6 lg:px-10 py-2'>
                <div className='flex items-center gap-1 md:gap-2'>
                    <Link
                        to='/'
                        className='flex bg-yellow-400 text-black font-bold items-center justify-center px-2 sm:px-4 py-2 rounded hover:bg-yellow-300'
                    >
                        <p className='hidden sm:block'>Back to Game</p>
                        <p className='block sm:hidden'>
                            <ChevronLeft size={16} />
                        </p>
                    </Link>
                    <h1 className='text-3xl font-bold hidden sm:block'>
                        Leaderboard
                    </h1>
                </div>
                <WalletMultiButton className='!bg-white !text-black hover:!bg-gray-200' />
            </div>

            {/* Main */}
            <main className='flex-grow'>
                <div className='max-w-4xl mx-auto pt-0 p-4 md:p-6'>
                    <div className='bg-gray-900 rounded-lg overflow-x-auto'>
                        {isLoading ? (
                            <div className='flex flex-col items-center justify-center py-8'>
                                <div className='animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-6' />
                                <div className='text-center space-y-2'>
                                    <h1 className='text-2xl sm:text-3xl font-semibold text-white'>
                                        Loading leaderboard data...
                                    </h1>
                                    <p className='text-gray-400 text-sm sm:text-base'>
                                        Please wait a moment. We're checking
                                        Solana blockchain.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className='w-full text-left border-collapse'>
                                <thead>
                                    <tr className='bg-[#240505] text-yellow-300'>
                                        <th className='px-4 py-3'>#</th>
                                        <th className='px-4 py-3'>Class</th>
                                        <th className='px-4 py-3 text-center'>
                                            Level
                                        </th>
                                        <th className='px-4 py-3 text-center'>
                                            Exp
                                        </th>
                                        <th className='px-4 py-3 text-center'>
                                            Killed
                                        </th>
                                        <th className='px-4 py-3 text-center'>
                                            Gold
                                        </th>
                                        <th className='px-4 py-3'>Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className='text-center text-gray-400 py-6'
                                            >
                                                No data available yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        leaderboard
                                            .sort(
                                                (a, b) =>
                                                    (b.exp || 0) - (a.exp || 0)
                                            )
                                            .map((entry, index) => (
                                                <tr
                                                    key={entry.mint}
                                                    className={
                                                        index % 2 === 0
                                                            ? 'bg-gray-800'
                                                            : 'bg-gray-700'
                                                    }
                                                >
                                                    <td className='px-4 py-3'>
                                                        {index + 1}
                                                    </td>
                                                    <td className='flex gap-1 items-center px-4 py-3'>
                                                        <img
                                                            src={`/class/class-${entry.class.toLowerCase()}.png`}
                                                            alt={
                                                                entry.class +
                                                                index
                                                            }
                                                            draggable={false}
                                                            className='hidden sm:block w-[30px] h-[30px]'
                                                        />
                                                        {entry.class}
                                                    </td>
                                                    <td className='px-4 py-3 text-center'>
                                                        {getLevelFromExp(
                                                            entry.exp || 0
                                                        )}
                                                    </td>
                                                    <td className='px-4 py-3 text-center'>
                                                        {entry.exp || 0}
                                                    </td>
                                                    <td className='px-4 py-3 text-center'>
                                                        {entry.killed || 0}
                                                    </td>
                                                    <td className='px-4 py-3 text-center'>
                                                        {entry.gold || 0}
                                                    </td>
                                                    <td className='px-4 py-3 font-mono'>
                                                        <a
                                                            href={`https://core.metaplex.com/explorer/${entry.mint}?env=devnet`}
                                                            target='_blank'
                                                            rel='noopener noreferrer'
                                                            className='text-blue-400 hover:underline'
                                                        >
                                                            {entry.owner
                                                                ? `${entry.owner.slice(0, 5)}...${entry.owner.slice(-5)}`
                                                                : '???'}
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <p className='text-center text-gray-400 mt-4'>
                        Leaderboard resets every 3 minutes
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className='w-full bg-black text-gray-400 text-center text-sm py-4 mt-8'>
                Created by{' '}
                <a
                    href='https://github.com/guysuvijak'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline text-white font-semibold'
                >
                    MeteorVIIx
                </a>{' '}
                and{' '}
                <a
                    href='https://aimpact.dev'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline hover:text-white'
                >
                    impact.dev
                </a>{' '}
                |{' '}
                <a
                    href='https://github.com/guysuvijak/solana-fantasy-rpg'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline hover:text-white'
                >
                    Github Repo
                </a>
            </footer>
        </div>
    );
};

export default Leaderboard;
