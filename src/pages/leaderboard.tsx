// src/pages/leaderboard.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ChevronLeft, Coins, Info, SearchCheck, Skull } from 'lucide-react';
import { useMetaplexGame } from '@/hooks/useMetaplexGame';
import { PlayerData } from '@/types/game';
import { getCache, setCache } from '@/utils/cache';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ThemeToggle from '@/components/ThemeToggle';
import { useWallet } from '@solana/wallet-adapter-react';

const Leaderboard = () => {
    const { wallet } = useWallet();
    const playerAddress = wallet?.adapter?.publicKey?.toBase58();
    const { loadLeaderboardData } = useMetaplexGame();
    const [leaderboard, setLeaderboard] = useState<PlayerData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expTable, setExpTable] = useState<Record<string, number>>({});

    useEffect(() => {
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
                setCache('leaderboard', data);
            }

            setIsLoading(false);
        };

        fetch('/fantasy-rpg-exp.json')
            .then((res) => res.json())
            .then((data) => setExpTable(data))
            .catch(console.error);

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
        <div className='min-h-screen flex flex-col bg-background text-foreground'>
            <header className='sticky top-0 z-10 bg-background/50 backdrop-blur-md border-b border-border px-4 py-3 flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                    <Link to='/'>
                        <TooltipWrapper message='Back'>
                            <Button
                                variant='secondary'
                                size='sm'
                                className='gap-2 cursor-pointer'
                            >
                                <ChevronLeft className='h-4 w-4' />
                                <span className='hidden sm:inline'>
                                    Back to Game
                                </span>
                            </Button>
                        </TooltipWrapper>
                    </Link>
                    <h1 className='hidden sm:block text-lg sm:text-2xl font-bold'>
                        Leaderboard
                    </h1>
                </div>
                <div className='flex items-center gap-2'>
                    <ThemeToggle />
                    <WalletMultiButton className='!bg-primary !text-primary-foreground hover:!opacity-90' />
                </div>
            </header>

            <main className='flex-grow p-4 sm:p-6 md:p-10'>
                <Card className='max-w-6xl mx-auto'>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            Top Players
                            <TooltipWrapper message='Ranking sort by "Killed" > "EXP"'>
                                <Info
                                    size={20}
                                    className='text-muted-foreground cursor-pointer'
                                />
                            </TooltipWrapper>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className='space-y-4'>
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className='w-full h-10 rounded'
                                    />
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Top 3 Card */}
                                <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6'>
                                    {leaderboard
                                        .slice(0, 3)
                                        .map((entry, index) => (
                                            <Card
                                                key={entry.mint}
                                                className={`border-border bg-gradient-to-tr from-background ${index === 0 ? 'to-yellow-100 dark:to-yellow-800' : index === 1 ? 'to-blue-100 dark:to-blue-800' : 'to-orange-100 dark:to-orange-800'}`}
                                            >
                                                <CardHeader>
                                                    <CardTitle className='text-lg sm:text-xl md:text-2xl'>
                                                        {index === 0 &&
                                                            '🏆 Rank 1'}
                                                        {index === 1 &&
                                                            '🎖 Rank 2'}
                                                        {index === 2 &&
                                                            '🏅 Rank 3'}
                                                        <span
                                                            className={`${playerAddress === entry.owner && 'text-orange-600 dark:text-yellow-300'}`}
                                                        >
                                                            {playerAddress ===
                                                                entry.owner &&
                                                                ' (You)'}
                                                        </span>
                                                    </CardTitle>
                                                    <CardDescription className='space-x-1'>
                                                        <TooltipWrapper message='Metaplex Detail'>
                                                            <a
                                                                href={`https://core.metaplex.com/explorer/${entry.mint}?env=devnet`}
                                                                target='_blank'
                                                                rel='noopener noreferrer'
                                                                className={`text-blue-600 dark:text-blue-500 hover:underline`}
                                                            >
                                                                {entry.owner
                                                                    ? `${entry.owner.slice(0, 5)}...${entry.owner.slice(-5)}`
                                                                    : '???'}
                                                            </a>
                                                        </TooltipWrapper>
                                                        {entry.owner && (
                                                            <TooltipWrapper message='View on Solscan'>
                                                                <a
                                                                    href={`https://solscan.io/token/${entry.mint}?cluster=devnet`}
                                                                    target='_blank'
                                                                    rel='noopener noreferrer'
                                                                    className='inline-flex items-center justify-center text-xs bg-primary text-primary-foreground px-1 py-0.5 rounded'
                                                                >
                                                                    <SearchCheck
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </a>
                                                            </TooltipWrapper>
                                                        )}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className='flex items-center gap-4'>
                                                    <img
                                                        src={`/class/class-${entry.class.toLowerCase()}.png`}
                                                        alt={entry.class}
                                                        className='w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full'
                                                        draggable={false}
                                                    />
                                                    <div className='text-sm'>
                                                        <p className='font-semibold'>
                                                            {entry.class} LV{' '}
                                                            {getLevelFromExp(
                                                                entry.exp || 0
                                                            )}
                                                        </p>
                                                        <p className='text-orange-600 dark:text-yellow-500'>
                                                            EXP: {entry.exp}
                                                        </p>
                                                        <p className='flex items-center gap-1 text-orange-600 dark:text-yellow-500'>
                                                            Killed:{' '}
                                                            {entry.killed}{' '}
                                                            <Skull
                                                                size={16}
                                                                className='text-muted-foreground'
                                                            />
                                                        </p>
                                                        <p className='flex items-center gap-1 text-orange-600 dark:text-yellow-500'>
                                                            Gold: {entry.gold}{' '}
                                                            <Coins
                                                                size={16}
                                                                className='text-muted-foreground'
                                                            />
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>

                                {/* Rank 4–20 Table */}
                                <div className='w-full overflow-x-auto'>
                                    <ScrollArea className='min-w-[620px]'>
                                        <table className='w-full text-sm sm:text-base'>
                                            <thead>
                                                <tr className='border-b border-border text-muted-foreground'>
                                                    <th className='text-center py-2 px-2'>
                                                        #
                                                    </th>
                                                    <th className='text-left py-2 px-2'>
                                                        Address
                                                    </th>
                                                    <th className='text-left py-2 px-2'>
                                                        Class
                                                    </th>
                                                    <th className='text-center py-2 px-2'>
                                                        Level
                                                    </th>
                                                    <th className='text-center py-2 px-2'>
                                                        Exp
                                                    </th>
                                                    <th className='text-center py-2 px-2'>
                                                        Killed
                                                    </th>
                                                    <th className='text-center py-2 px-2'>
                                                        Gold
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leaderboard.length <= 3 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={7}
                                                            className='text-center py-4 text-muted'
                                                        >
                                                            No additional data.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    leaderboard
                                                        .slice(3, 20)
                                                        .map((entry, index) => (
                                                            <tr
                                                                key={entry.mint}
                                                                className={`border-b border-border hover:bg-slate-300 dark:hover:bg-slate-600
                    ${(index + 3) % 2 === 0 ? 'bg-muted/20' : 'bg-muted'}
                  `}
                                                            >
                                                                <td className='text-center py-2 px-2 text-muted-foreground'>
                                                                    {index + 4}
                                                                </td>
                                                                <td className='py-2 px-2'>
                                                                    <div className='flex gap-2 items-center'>
                                                                        {entry.owner && (
                                                                            <TooltipWrapper message='View on Solscan'>
                                                                                <a
                                                                                    href={`https://solscan.io/token/${entry.mint}?cluster=devnet`}
                                                                                    target='_blank'
                                                                                    rel='noopener noreferrer'
                                                                                    className='inline-flex items-center justify-center text-xs bg-primary text-primary-foreground px-1 py-0.5 rounded'
                                                                                >
                                                                                    <SearchCheck
                                                                                        size={
                                                                                            14
                                                                                        }
                                                                                    />
                                                                                </a>
                                                                            </TooltipWrapper>
                                                                        )}
                                                                        <TooltipWrapper message='Metaplex Detail'>
                                                                            <a
                                                                                href={`https://core.metaplex.com/explorer/${entry.mint}?env=devnet`}
                                                                                target='_blank'
                                                                                rel='noopener noreferrer'
                                                                                className={`${
                                                                                    playerAddress ===
                                                                                    entry.owner
                                                                                        ? 'text-orange-600 dark:text-yellow-300'
                                                                                        : 'text-blue-600 dark:text-blue-500'
                                                                                } hover:underline`}
                                                                            >
                                                                                {entry.owner
                                                                                    ? `${entry.owner.slice(0, 5)}...${entry.owner.slice(-5)}${playerAddress === entry.owner ? ' (You)' : ''}`
                                                                                    : '???'}
                                                                            </a>
                                                                        </TooltipWrapper>
                                                                    </div>
                                                                </td>
                                                                <td className='flex items-center gap-2 py-2 px-2'>
                                                                    <img
                                                                        src={`/class/class-${entry.class.toLowerCase()}.png`}
                                                                        alt={
                                                                            entry.class
                                                                        }
                                                                        className='hidden sm:block w-6 h-6'
                                                                        draggable={
                                                                            false
                                                                        }
                                                                    />
                                                                    {
                                                                        entry.class
                                                                    }
                                                                </td>
                                                                <td className='text-center py-2 px-2'>
                                                                    {getLevelFromExp(
                                                                        entry.exp ||
                                                                            0
                                                                    )}
                                                                </td>
                                                                <td className='text-center py-2 px-2'>
                                                                    {entry.exp ||
                                                                        0}
                                                                </td>
                                                                <td className='text-center py-2 px-2'>
                                                                    {entry.killed ||
                                                                        0}
                                                                </td>
                                                                <td className='text-center py-2 px-2'>
                                                                    {entry.gold ||
                                                                        0}
                                                                </td>
                                                            </tr>
                                                        ))
                                                )}
                                            </tbody>
                                        </table>
                                    </ScrollArea>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
                <p className='text-center text-xs text-muted-foreground mt-4'>
                    Leaderboard resets every 3 minutes.
                </p>
            </main>

            <Separator className='my-4' />
            <footer className='text-center text-muted-foreground text-sm pb-6'>
                Created by{' '}
                <a
                    href='https://github.com/guysuvijak'
                    target='_blank'
                    className='underline font-medium hover:text-foreground'
                >
                    MeteorVIIx
                </a>{' '}
                and{' '}
                <a
                    href='https://aimpact.dev'
                    target='_blank'
                    className='underline hover:text-foreground'
                >
                    impact.dev
                </a>{' '}
                |{' '}
                <a
                    href='https://github.com/guysuvijak/solana-fantasy-rpg'
                    target='_blank'
                    className='underline hover:text-foreground'
                >
                    Github Repo
                </a>
            </footer>
        </div>
    );
};

export default Leaderboard;
