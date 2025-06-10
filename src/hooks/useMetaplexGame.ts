import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useCallback } from 'react';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import {
    mplCore,
    fetchAssetsByOwner,
    fetchAssetsByCollection,
    createCollection,
    create,
    update,
    fetchAsset,
    fetchCollection
} from '@metaplex-foundation/mpl-core';
import {
    createSignerFromKeypair,
    generateSigner,
    publicKey,
    some,
    transactionBuilder
} from '@metaplex-foundation/umi';
import { PlayerData, Monster, MONSTERS } from '../types/game';
import bs58 from 'bs58';

const COLLECTION_NAME = import.meta.env.VITE_COLLECTION_NAME;
const COLLECTION_ADDRESS = import.meta.env.VITE_COLLECTION_ADDRESS;
const SIGNER_ADDRESS = import.meta.env.VITE_SIGNER_ADDRESS;

export const useMetaplexGame = () => {
    const { connection } = useConnection();
    const { wallet, publicKey: walletPublicKey } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [playerAssetAddress, setPlayerAssetAddress] = useState<string | null>(
        null
    );
    const [collectionAddress, setCollectionAddress] = useState<string | null>(
        null
    );

    const getUmi = useCallback(() => {
        if (!walletPublicKey) return null;
        if (!wallet || !wallet.adapter?.connected) {
            throw new Error('Wallet not connected properly.');
        }
        const umi = createUmi(connection.rpcEndpoint)
            .use(walletAdapterIdentity(wallet?.adapter))
            .use(mplCore());
        return umi;
    }, [connection, walletPublicKey]);

    const getSigner = () => {
        const umi = getUmi();
        if (!umi) throw new Error('Umi not initialized');
        const signer = generateSigner(umi);
        const myKeypair = umi.eddsa.generateKeypair();
        const keyypair = createSignerFromKeypair(umi, myKeypair);
        console.log('signer', signer);
        console.log('keyypair', keyypair);
    };

    const findPlayerAsset = useCallback(async (): Promise<string | null> => {
        if (!walletPublicKey) return null;
        const umi = getUmi();
        if (!umi) return null;
        try {
            const assets = await fetchAssetsByOwner(
                umi,
                publicKey(walletPublicKey.toString())
            );
            const gameAsset = assets.find((asset) =>
                asset.name.startsWith('Fantasy RPG Character')
            );
            return gameAsset ? gameAsset.publicKey.toString() : null;
        } catch (error) {
            console.error('Error finding player asset:', error);
            return null;
        }
    }, [walletPublicKey, getUmi]);

    const initializePlayer = useCallback(
        async (className: string): Promise<PlayerData> => {
            if (!walletPublicKey) throw new Error('Wallet not connected');
            const umi = getUmi();
            if (!umi) throw new Error('Umi not initialized');
            setIsLoading(true);
            try {
                const initialPlayerData: PlayerData = {
                    class: className,
                    killed: 0,
                    gold: 0,
                    hp: 100,
                    exp: 0
                };
                const assetSigner = generateSigner(umi);
                const collection = await fetchCollection(
                    umi,
                    collectionAddress || COLLECTION_ADDRESS
                );

                const tx = transactionBuilder().add(
                    create(umi, {
                        name: `Fantasy RPG Character - ${className}`,
                        uri: await uploadMetadata(initialPlayerData),
                        asset: assetSigner,
                        owner: publicKey(walletPublicKey.toString()),
                        collection: collection,
                        plugins: [
                            {
                                type: 'TransferDelegate',
                                authority: {
                                    type: 'Address',
                                    address: SIGNER_ADDRESS
                                }
                            },
                            {
                                type: 'UpdateDelegate',
                                authority: {
                                    type: 'Address',
                                    address: SIGNER_ADDRESS
                                },
                                additionalDelegates: [SIGNER_ADDRESS]
                            }
                        ]
                    })
                );

                await tx.sendAndConfirm(umi, {
                    confirm: { commitment: 'finalized' }
                });
                const assetAddress = assetSigner.publicKey.toString();
                setPlayerAssetAddress(assetAddress);
                return initialPlayerData;
            } finally {
                setIsLoading(false);
            }
        },
        [walletPublicKey, getUmi, collectionAddress]
    );

    const uploadMetadata = async (playerData: PlayerData): Promise<string> => {
        const metadata = {
            name: `Fantasy RPG Character - ${playerData.class}`,
            description: `A ${playerData.class} character in Fantasy RPG game`,
            image: `https://solana-fantasy-rpg.vercel.app/class/class-${playerData.class.toLowerCase()}.png`,
            attributes: [
                { trait_type: 'Class', value: playerData.class },
                { trait_type: 'Monsters Killed', value: playerData.killed },
                { trait_type: 'Gold', value: playerData.gold },
                { trait_type: 'HP', value: playerData.hp },
                { trait_type: 'EXP', value: playerData.exp }
            ],
            properties: {
                category: 'image',
                files: [
                    {
                        uri: `https://solana-fantasy-rpg.vercel.app/class/class-${playerData.class.toLowerCase()}.png`,
                        type: 'image/png'
                    }
                ]
            }
        };
        return `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
    };

    const createCollectionCharacter = useCallback(async () => {
        const umi = getUmi();
        if (!umi) throw new Error('Umi not initialized');

        const collectionSigner = generateSigner(umi);

        await createCollection(umi, {
            collection: collectionSigner,
            name: COLLECTION_NAME,
            uri: 'https://solana-fantasy-rpg.vercel.app/collection/fantasy-rpg-collection.json'
        }).sendAndConfirm(umi);

        const collectionAddr = collectionSigner.publicKey.toString();
        console.log('collectionAddr', collectionAddr);
        setCollectionAddress(collectionAddr);
        return collectionAddr;
    }, [walletPublicKey, getUmi]);

    const loadPlayerData = useCallback(async (): Promise<PlayerData | null> => {
        if (!walletPublicKey) return null;
        const umi = getUmi();
        if (!umi) return null;

        setIsLoading(true);
        try {
            const assetAddress = await findPlayerAsset();
            if (!assetAddress) return null;

            setPlayerAssetAddress(assetAddress);

            const assets = await fetchAssetsByOwner(
                umi,
                publicKey(walletPublicKey.toString())
            );

            const asset = assets.find((a) =>
                a.name.startsWith('Fantasy RPG Character')
            );
            if (!asset || !asset.uri) return null;

            const metadataResponse = await fetch(asset.uri);
            const metadata = await metadataResponse.json();

            const attributes = metadata.attributes;

            if (attributes) {
                return {
                    class:
                        attributes.find((a: any) => a.trait_type === 'Class')
                            ?.value ?? 'Warrior',
                    killed:
                        attributes.find(
                            (a: any) => a.trait_type === 'Monsters Killed'
                        )?.value ?? 0,
                    gold:
                        attributes.find((a: any) => a.trait_type === 'Gold')
                            ?.value ?? 0,
                    hp:
                        attributes.find((a: any) => a.trait_type === 'HP')
                            ?.value ?? 100,
                    exp:
                        attributes.find((a: any) => a.trait_type === 'EXP')
                            ?.value ?? 0,
                    owner: attributes.owner
                };
            }

            return null;
        } catch (e) {
            console.error('loadPlayerData failed', e);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [walletPublicKey, getUmi, findPlayerAsset]);

    const updatePlayerData = useCallback(
        async (playerData: PlayerData): Promise<string> => {
            if (!walletPublicKey || !playerAssetAddress)
                throw new Error('Player not initialized');
            const umi = getUmi();
            if (!umi) throw new Error('Umi not initialized');
            setIsLoading(true);
            try {
                const asset = await fetchAsset(
                    umi,
                    publicKey(playerAssetAddress)
                );
                const collection = await fetchCollection(
                    umi,
                    collectionAddress || COLLECTION_ADDRESS
                );
                const tx = await update(umi, {
                    asset: asset,
                    uri: some(await uploadMetadata(playerData)),
                    collection: collection
                }).sendAndConfirm(umi);
                const txSignature = bs58.encode(tx.signature);
                return txSignature;
            } finally {
                setIsLoading(false);
            }
        },
        [walletPublicKey, playerAssetAddress, getUmi]
    );

    const loadLeaderboardData = useCallback(async () => {
        if (!walletPublicKey) return null;
        const umi = getUmi();
        if (!umi) return null;

        const collectionPubKey = publicKey(COLLECTION_ADDRESS);

        const assets = await fetchAssetsByCollection(umi, collectionPubKey);

        const players: PlayerData[] = [];

        for (const asset of assets) {
            if (!asset.uri) continue;
            const res = await fetch(asset.uri);
            const metadata = await res.json();
            const attrs = metadata.attributes;

            players.push({
                class:
                    attrs.find((a: any) => a.trait_type === 'Class')?.value ??
                    'Unknown',
                killed: Number(
                    attrs.find((a: any) => a.trait_type === 'Monsters Killed')
                        ?.value ?? 0
                ),
                gold: Number(
                    attrs.find((a: any) => a.trait_type === 'Gold')?.value ?? 0
                ),
                exp: Number(
                    attrs.find((a: any) => a.trait_type === 'EXP')?.value ?? 0
                ),
                owner: asset.owner,
                mint: asset.publicKey
            });
        }

        return players.sort((a, b) => b.killed - a.killed);
    }, [getUmi]);

    const attackMonster = useCallback(
        async (
            currentPlayerData: PlayerData
        ): Promise<{
            monster: Monster;
            goldEarned: number;
            expEarned: number;
            lostHp: number;
            newPlayerData: PlayerData;
            txSignature: string;
        }> => {
            if (!playerAssetAddress) throw new Error('Player not initialized');
            const monster =
                MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
            const goldEarned = Math.floor(Math.random() * 10) + 1;
            const lostHp = Math.floor(Math.random() * 11);
            const expEarned = Math.floor(Math.random() * 10) + 1;
            const newPlayerData: PlayerData = {
                ...currentPlayerData,
                killed: currentPlayerData.killed + 1,
                gold: currentPlayerData.gold + goldEarned,
                hp: currentPlayerData.hp
                    ? Math.max(currentPlayerData.hp - lostHp, 0)
                    : 100,
                exp: expEarned
            };
            const txSignature = await updatePlayerData(newPlayerData);
            return {
                monster,
                goldEarned,
                expEarned,
                lostHp,
                newPlayerData,
                txSignature
            };
        },
        [playerAssetAddress, updatePlayerData]
    );

    const buyPotion = useCallback(
        async (currentPlayerData: PlayerData): Promise<PlayerData> => {
            if (!playerAssetAddress) throw alert('Player not initialized');

            if (currentPlayerData.hp === 100) {
                throw alert('You dont need to buy it.');
            }

            if (currentPlayerData.gold < 10) {
                throw alert('Not enough gold to buy potion');
            }

            const newHp = Math.min((currentPlayerData.hp || 0) + 20, 100);
            const newGold = currentPlayerData.gold - 10;

            const updatedPlayer: PlayerData = {
                ...currentPlayerData,
                gold: newGold,
                hp: newHp
            };

            await updatePlayerData(updatedPlayer);
            return updatedPlayer;
        },
        [playerAssetAddress, updatePlayerData]
    );

    return {
        initializePlayer,
        loadPlayerData,
        updatePlayerData,
        createCollectionCharacter,
        loadLeaderboardData,
        attackMonster,
        findPlayerAsset,
        buyPotion,
        getSigner,
        isLoading,
        isConnected: !!walletPublicKey,
        playerAssetAddress
    };
};
