import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useMetaplexGame } from '@/hooks/useMetaplexGame';
import {
    PlayerData,
    BattleLog,
    Monster,
    DEFAULT_CHARACTER_STATS
} from '@/types/game';
import {
    Coins,
    Scroll,
    Axe,
    Bug,
    Ghost,
    PawPrint,
    Skull,
    ShoppingCart,
    ExternalLink,
    SearchCheck,
    Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { toast } from 'sonner';

export const GameInterface = () => {
    const { connected } = useWallet();
    const {
        initializePlayer,
        loadPlayerData,
        attackMonster,
        findPlayerAsset,
        createCollectionCharacter,
        buyPotion,
        isLoading,
        playerAssetAddress
    } = useMetaplexGame();

    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [expTable, setExpTable] = useState<Record<string, number>>({});
    const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);
    const [isAttacking, setIsAttacking] = useState(false);
    const [attackProgress, setAttackProgress] = useState(0);
    const [showClassSelection, setShowClassSelection] = useState(false);
    const [isLoadingPlayer, setIsLoadingPlayer] = useState(false);

    const CHARACTER_CLASSES = ['Warrior', 'Mage', 'Archer', 'Rogue'];

    useEffect(() => {
        if (connected) {
            loadPlayer();
        } else {
            setPlayerData(null);
            setBattleLogs([]);
            setShowClassSelection(false);
        }
    }, [connected]);

    const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) return error.message;
        if (typeof error === 'string') return error;
        return 'An unknown error occurred';
    };

    const loadPlayer = async () => {
        try {
            setIsLoadingPlayer(true);

            const foundAsset = await findPlayerAsset();
            if (foundAsset) {
                const data = await loadPlayerData();
                if (data) {
                    setPlayerData(data);
                    setShowClassSelection(false);

                    const logs = localStorage.getItem(
                        `battle_logs_${foundAsset}`
                    );

                    if (logs) {
                        setBattleLogs(JSON.parse(logs));
                    }
                }

                fetch('/fantasy-rpg-exp.json')
                    .then((res) => res.json())
                    .then((data) => setExpTable(data))
                    .catch((err) => [toast('Failed to load exp table', err), console.error('Failed to load exp table', err)]);

                setIsLoadingPlayer(false);
            } else {
                setIsLoadingPlayer(false);
                setShowClassSelection(true);
            }
        } catch (error) {
            setIsLoadingPlayer(false);
            toast(`Failed to load player: ${getErrorMessage(error)}`);
            console.error(`Failed to load player: ${getErrorMessage(error)}`);
        }
    };

    const createCharacter = async (className: string) => {
        try {
            const data = await initializePlayer(className);
            setPlayerData(data);
            setShowClassSelection(false);
            setBattleLogs([]);
            toast('Welcome to Fantasy RPG !!!');
        } catch (error) {
            toast(`Failed to create character: ${getErrorMessage(error)}`);
            console.error(`Failed to create character: ${getErrorMessage(error)}`);
        }
    };

    const attack = async () => {
        if (!playerData || isAttacking) return;
        if (playerData.hp && playerData.hp < 10) {
            toast('Please use potions and have more than 10 HP.');
        }

        setIsAttacking(true);
        setAttackProgress(0);

        // 5-second progress animation
        const interval = setInterval(() => {
            setAttackProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2;
            });
        }, 100);

        try {
            // Wait for animation
            await new Promise((resolve) => setTimeout(resolve, 5000));

            // Execute attack on-chain
            const {
                monster,
                goldEarned,
                expEarned,
                lostHp,
                newPlayerData,
                txSignature
            } = await attackMonster(playerData);

            setPlayerData(newPlayerData);

            const newLog: BattleLog = {
                id: Date.now().toString(),
                monster,
                goldEarned,
                expEarned,
                lostHp,
                timestamp: Date.now(),
                txSignature
            };

            const updatedLogs = [newLog, ...battleLogs].slice(0, 10);
            setBattleLogs(updatedLogs);

            // Store battle logs locally (since they're not critical on-chain data)
            if (playerAssetAddress) {
                localStorage.setItem(
                    `battle_logs_${playerAssetAddress}`,
                    JSON.stringify(updatedLogs)
                );
            }
            toast('Attack success.');
        } catch (error) {
            toast(`Attack failed: ${getErrorMessage(error)}`);
            console.error(`Attack failed: ${getErrorMessage(error)}`);
        }

        setIsAttacking(false);
        setAttackProgress(0);
    };

    const buyPotionClick = async (playerData: PlayerData) => {
        try {
            const updated = await buyPotion(playerData);
            setPlayerData(updated);
            toast('Buy potion success.');
        } catch (err) {
            toast(`Buy potion failed: ${getErrorMessage(err)}`);
            console.error(`Buy potion failed: ${getErrorMessage(err)}`);
        }
    };

    const getLevelFromExp = (exp: number): number => {
        const levels = Object.entries(expTable)
            .map(([level, threshold]) => ({ level: Number(level), threshold }))
            .sort((a, b) => a.level - b.level);

        for (let i = 0; i < levels.length; i++) {
            if (exp < levels[i].threshold) {
                return levels[i].level;
            }
        }

        return levels[levels.length - 1]?.level || 1; // Max level fallback
    };

    if (!connected) {
        return (
            <div className='min-h-screen bg-gradient-to-tr from-[#360000] to-[#12003b] flex items-center justify-center'>
                <div className='text-center'>
                    <h1 className='text-4xl font-bold text-yellow-300 mb-4'>
                        Fantasy RPG
                    </h1>
                    <p className='text-white mb-6'>
                        Fantasy RPG is idle & text-based GameFi on Solana
                        Blockchain, create mvp with Aimpact.dev
                    </p>
                    <p className='text-gray-400 mb-8'>
                        Connect your Solana wallet to start your adventure!
                    </p>
                    <WalletMultiButton className='!bg-white !text-black hover:!bg-gray-200' />
                </div>
            </div>
        );
    }

    if (showClassSelection) {
        return (
            <div className='min-h-screen bg-black text-white p-6'>
                {isLoading && (
                    <div className='absolute p-0 m-0 min-w-screen min-h-screen bg-black/80 flex items-center justify-center'>
                        <div className='text-center'>
                            <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4'></div>
                            <p className='text-white'>Loading...</p>
                        </div>
                    </div>
                )}
                <div className='max-w-2xl mx-auto'>
                    <div className='flex justify-between items-center mb-8'>
                        

            <button onClick={() => createCollectionCharacter()} className='z-100'>createCollectionCharacter</button>
                        <h1 className='text-3xl font-bold'>Fantasy RPG</h1>
                        <WalletMultiButton className='!bg-white !text-black hover:!bg-gray-200' />
                    </div>

                    <div className='bg-gray-900 rounded-lg p-8 text-center'>
                        <h2 className='text-2xl font-semibold mb-6'>
                            Choose Your Class
                        </h2>
                        <p className='text-gray-400 mb-8'>
                            Select a character class to begin your adventure.
                            This will create an NFT on Solana representing your
                            character.
                        </p>

                        <div className='grid grid-cols-2 gap-4'>
                            {CHARACTER_CLASSES.map((className, index) => (
                                <div
                                    key={className + index}
                                    className='flex flex-col space-y-2'
                                >
                                    <img
                                        src={`/class/class-${className.toLowerCase()}.png`}
                                        alt={className}
                                        draggable={false}
                                        className='w-full'
                                    />
                                    <button
                                        key={className}
                                        onClick={() =>
                                            createCharacter(className)
                                        }
                                        disabled={isLoading}
                                        className='cursor-pointer bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 font-semibold py-2 md:py-4 px-6 rounded-lg transition-colors'
                                    >
                                        {className}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <p className='text-xs text-gray-500 mt-6'>
                            ⚠️ Creating a character requires a small SOL
                            transaction fee
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoadingPlayer) {
        return (
            <div className='absolute inset-0 bg-gradient-to-tr from-[#1d0000] to-[#09001f] flex flex-col items-center justify-center'>
                {/* Loading Spinner */}
                <div className='animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-6' />

                {/* Text */}
                <div className='text-center space-y-2'>
                    <h1 className='text-3xl sm:text-4xl font-semibold text-white'>
                        Loading player data...
                    </h1>
                    <p className='text-gray-400 text-sm sm:text-base'>
                        Please wait a moment. We're checking your NFT.
                    </p>
                </div>
            </div>
        );
    }

    if (!playerData) {
        return (
            <div className='min-h-screen bg-black flex items-center justify-center'>
                <div className='text-center'>
                    <p className='text-white'>Failed to load character data</p>
                    <button
                        onClick={loadPlayer}
                        className='mt-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-200'
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const IconMonster = (monster: Monster) => {
        switch (monster) {
            case 'Slime':
                return <Bug size={20} className='text-green-400' />;
            case 'Goblin':
                return <Ghost size={20} className='text-lime-500' />;
            case 'Orc':
                return <Skull size={20} className='text-red-500' />;
            case 'Wolf':
                return <PawPrint size={20} className='text-gray-400' />;
            default:
                return <Skull size={20} className='text-white' />;
        }
    };

    const getComputedStats = () => {
        const base = DEFAULT_CHARACTER_STATS[playerData.class];
        const level = currentLevel - 1;

        return {
            atk: base.atk + level,
            agi: base.agi + level,
            vit: base.vit + level,
            int: base.int + level
        };
    };

    const currentLevel = getLevelFromExp(playerData.exp || 0);
    const exp = playerData.exp || 0;

    const currentLevelExp = expTable[(currentLevel - 1).toString()] || 0;
    const nextLevelExp = expTable[currentLevel.toString()] || 100;

    const expRange = nextLevelExp - currentLevelExp;
    const expIntoLevel = exp - currentLevelExp;
    const expPercent =
        expRange > 0 ? Math.floor((expIntoLevel / expRange) * 100) : 0;

    return (
        <div className='min-h-screen bg-gradient-to-tr from-[#130000] to-[#060014] text-white'>
            {/* Header */}
            <div className='flex sticky top-0 justify-between items-center mb-4 bg-gradient-to-b from-[#210035] to-[#16004b] px-4 md:px-6 lg:px-10 py-2'>
                <div className='flex items-center gap-1 md:gap-2'>
                    <img
                        src={'/favicon.ico'}
                        alt={'Logo'}
                        draggable={false}
                        className='w-[32px] h-[32px] md:w-[40px] md:h-[40px]'
                    />
                    <h1 className='text-lg md:text-3xl font-bold'>
                        Fantasy RPG
                    </h1>
                </div>
                <WalletMultiButton className='!bg-white !text-black hover:!bg-gray-200' />
            </div>
            <div className='max-w-4xl mx-auto pt-0 p-4 md:p-6'>
                {/* Asset Address Display */}
                {playerAssetAddress && (
                    <div className='flex flex-col bg-gray-900 rounded-lg p-4 mb-6 items-center gap-4'>
                        <div className='flex w-full gap-4 justify-center'>
                            <img
                                src={`/class/class-${playerData.class.toLowerCase()}.png`}
                                alt={playerData.class}
                                draggable={false}
                                className='w-[120px] h-[120px] rounded-full'
                            />
                            <div className='flex flex-col justify-center gap-1'>
                                <div className='flex justify-between items-end gap-2'>
                                    <h2 className='text-xl font-semibold flex items-center text-yellow-400'>
                                        {playerData.class}
                                    </h2>
                                    <h2 className='text-xl font-semibold'>
                                        LV{' '}
                                        <span className='text-green-400'>
                                            {currentLevel}
                                        </span>
                                    </h2>
                                </div>
                                <p>
                                    HP:{' '}
                                    <span className='text-red-400'>
                                        {playerData.hp || 100}/100
                                    </span>
                                </p>
                                <div className='bg-gray-700 rounded-full h-2 mb-2'>
                                    <div
                                        className='bg-red-500 h-2 rounded-full transition-all duration-100'
                                        style={{ width: `${playerData.hp}%` }}
                                    ></div>
                                </div>
                                <p>
                                    EXP:{' '}
                                    <span className='text-yellow-400'>
                                        {playerData.exp || 0}/{nextLevelExp}
                                    </span>
                                </p>
                                <div className='bg-gray-700 rounded-full h-2 mb-2'>
                                    <div
                                        className='bg-yellow-500 h-2 rounded-full transition-all duration-100'
                                        style={{ width: `${expPercent}%` }}
                                    ></div>
                                </div>
                                <p className='text-xs text-gray-400'>
                                    Character NFT Address:
                                </p>
                                <div className='flex items-center gap-2'>
                                    <p className='text-sm font-mono text-white'>
                                        {`${playerAssetAddress.slice(0, 5)}.....${playerAssetAddress.slice(-5)}`}
                                    </p>
                                    <TooltipWrapper message='Detail on Solscan'>
                                        <a
                                            href={`https://solscan.io/token/${playerAssetAddress}?cluster=devnet`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-700 text-white px-1 py-1 rounded transition'
                                        >
                                            <SearchCheck size={14} />
                                        </a>
                                    </TooltipWrapper>
                                    <TooltipWrapper message='Detail on Metaplex'>
                                        <a
                                            href={`https://core.metaplex.com/explorer/${playerAssetAddress}?env=devnet`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-700 text-white px-1 py-1 rounded transition'
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    </TooltipWrapper>
                                </div>
                            </div>
                        </div>
                        <div className='w-full h-[1px] bg-border' />
                        {/* Character Stats Section */}
                        <div className='w-full bg-gray-800 rounded p-4 pb-2 space-y-1 text-sm'>
                            <div className='grid grid-cols-4 gap-4'>
                                {Object.entries(getComputedStats()).map(
                                    ([key, value]) => (
                                        <div
                                            key={key}
                                            className='flex flex-col bg-gradient-to-b from-[#3b0101] border border-black to-[#110d0d] rounded text-center items-center justify-center py-4'
                                        >
                                            <span className='text-[#e2e2e2]'>
                                                {key.toUpperCase()}
                                            </span>
                                            <span className='text-xl font-bold'>
                                                {value}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                            <p className='text-muted-foreground text-center'>
                                Status values are allocated according to class
                                and increase by +1 at every level.
                            </p>
                        </div>
                        <div className='w-full h-[1px] bg-border' />
                        <div className='grid grid-cols-2 gap-4'>
                            <TooltipWrapper message='Get Kill count from "Attack Monster"'>
                                <div className='flex items-center'>
                                    <Skull
                                        className='mr-2 text-yellow-500'
                                        size={20}
                                    />
                                    <span>Killed: {playerData.killed}</span>
                                </div>
                            </TooltipWrapper>
                            <TooltipWrapper message='Earn from "Attack Monster"'>
                                <div className='flex items-center'>
                                    <Coins
                                        className='mr-2 text-yellow-500'
                                        size={20}
                                    />
                                    <span>Gold: {playerData.gold}</span>
                                </div>
                            </TooltipWrapper>
                        </div>
                        <Link
                            to='/leaderboard'
                            className='w-full text-center bg-yellow-400 text-black font-bold py-2 px-4 rounded hover:bg-yellow-300 transition'
                        >
                            🏆 View Leaderboard
                        </Link>
                    </div>
                )}

                {/* Shop Section */}
                <div className='bg-gray-900 rounded-lg p-6 mb-6'>
                    <h3 className='text-lg font-semibold mb-4 flex items-center'>
                        <ShoppingCart className='mr-2' size={20} />
                        Shop
                    </h3>

                    <div className='flex justify-evenly items-center'>
                        <div className='flex flex-col items-center justify-center space-y-2'>
                            <img
                                src='/assets/shop/potion.webp'
                                alt='Potion'
                                draggable={false}
                                className='w-[60px] h-[60px] md:w-[120px] md:h-[120px] rounded-full'
                            />
                            <p className='text-center whitespace-pre-wrap'>
                                Potion (HP+10)
                            </p>
                            <TooltipWrapper message='Buy Potion'>
                                <button
                                    onClick={() => buyPotionClick(playerData)}
                                    className='cursor-pointer bg-black hover:bg-[#131313] rounded px-4 py-1'
                                >
                                    <div className='flex items-center gap-2'>
                                        <span>10</span>
                                        <Coins
                                            className='text-yellow-500'
                                            size={18}
                                        />
                                    </div>
                                </button>
                            </TooltipWrapper>
                        </div>
                    </div>
                </div>

                {/* Attack Section */}
                <div className='bg-gray-900 rounded-lg p-6 mb-6'>
                    <h3 className='text-lg font-semibold mb-4 flex items-center'>
                        <Axe className='mr-2' size={20} />
                        Combat
                        <TooltipWrapper message='Attack monster for earn Gold & Exp'>
                            <Info
                                size={20}
                                className='ml-2 text-muted-foreground hover:text-foreground'
                            />
                        </TooltipWrapper>
                    </h3>

                    {isAttacking ? (
                        <div className='mb-4'>
                            <div className='bg-gray-700 rounded-full h-4 mb-2'>
                                <div
                                    className='bg-white h-4 rounded-full transition-all duration-100'
                                    style={{ width: `${attackProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <div className='bg-gray-800 rounded-full h-4 mb-4' />
                    )}

                    <button
                        onClick={attack}
                        disabled={isAttacking}
                        className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-lg transition-colors
                            ${
                                isAttacking
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                            }
                        `}
                    >
                        {isAttacking ? (
                            <>
                                <div className='animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white' />
                                Attacking... {Math.round(attackProgress)}%
                            </>
                        ) : (
                            <>🗡️ Attack Monster</>
                        )}
                    </button>

                    <p className='text-xs text-muted-foreground mt-2 text-center'>
                        Each attack updates your character NFT on-chain
                    </p>
                    <p className='text-xs text-muted-foreground mt-2 text-center'>
                        (random monster: Slime, Goblin, Orc, Wolf)
                    </p>
                </div>

                {/* Battle Log */}
                <div className='bg-gray-900 rounded-lg p-6'>
                    <h3 className='text-lg font-semibold mb-4 flex items-center'>
                        <Scroll className='mr-2' size={20} />
                        Battle Log
                    </h3>

                    <div className='max-h-64 overflow-y-auto space-y-2'>
                        {battleLogs.length === 0 ? (
                            <p className='text-muted-foreground text-center py-4'>
                                No battles yet. Start attacking to see your
                                victories!
                            </p>
                        ) : (
                            battleLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className='bg-gray-800 rounded p-3'
                                >
                                    <div className='flex items-center gap-1'>
                                        {IconMonster(log.monster as Monster)}
                                        <p className='text-green-400'>
                                            You defeated a{' '}
                                            <span className='font-semibold text-white'>
                                                {log.monster}
                                            </span>{' '}
                                            and earned{' '}
                                            <span className='font-semibold text-yellow-400'>
                                                {log.goldEarned || 0} gold &{' '}
                                                {log.expEarned || 0} Exp
                                            </span>
                                            .
                                        </p>
                                    </div>
                                    <div className='text-xs text-muted-foreground mt-1 flex justify-between items-center'>
                                        <span>
                                            {new Date(
                                                log.timestamp
                                            ).toLocaleTimeString()}
                                        </span>
                                        <TooltipWrapper message='View Tx (Solscan)'>
                                            <a
                                                href={`https://solscan.io/tx/${log.txSignature}?cluster=devnet`}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='text-blue-400 hover:underline ml-2'
                                            >
                                                View Tx
                                            </a>
                                        </TooltipWrapper>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
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
