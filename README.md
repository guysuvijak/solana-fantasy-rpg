![Project Banner 0](/public/screenshot/readme-0.webp)

# 🐉 Solana Fantasy RPG

⚔️ **Solana Fantasy RPG** is a text-based idle GameFi adventure built on the Solana blockchain.
Players create a character, engage in turn-based combat, and earn on-chain rewards in an immersive RPG world.<br />
create project MVP with Aimpact ([https://aimpact.dev](https://aimpact.dev))

## 🚀 Live Demo

- Play now at: [https://solana-fantasy-rpg.vercel.app/](https://solana-fantasy-rpg.vercel.app/)

---

## How did I do this project

1. I create initial project without writing code at [https://aimpact.dev](https://aimpact.dev)
2. This my prompt & response from aimpact.dev [https://aimpact.dev/projects/985d1e48-f089-49bf-9d29-b294ec138efb](https://aimpact.dev/projects/985d1e48-f089-49bf-9d29-b294ec138efb)
3. I further developed this project with the help of ChatGPT and Grok to assist in writing the code.
4. What I added includes an NFT and Collection system using Metaplex, along with various gameplay mechanics to enhance the overall experience and make the game more complete and engaging.
5. Additionally, I aimed to make the game as on-chain and Solana-integrated as possible.
6. Finally, I deployed it on Vercel as a public-facing MVP project.

---

## 🎮 Features

- 🔓 **Connect Solana Wallet**
    - Seamless wallet integration via Phantom, Solflare or other wallet adapters.
- 🧙 **Class Selection**

    - Choose from 4 character classes: **Warrior, Mage, Archer, Rogue**.
    - Each class has unique starting stats (ATK, AGI, VIT, INT).

- ⚔️ **Combat System**

    - Attack random enemies (Slime, Goblin, Orc, Wolf).
    - Earn Gold and EXP through each battle.
    - Character HP system
    - On-chain updates with every attack via Metaplex interaction.

- 💊 **Item Shop**

    - Purchase healing potions using in-game Gold.

- 📈 **Leveling System**

    - EXP thresholds defined in `fantasy-rpg-exp.json`
    - Stats increase by +1 per level.

- 🏆 **Leaderboard**

    - Tracks all players by EXP, Gold, and Kill count.
    - Leaderboard data is cached and refreshed every 3 minutes.

- 🧾 **Battle Log**

    - Displays the latest 10 battles with monster type, rewards, and transaction link.

- 🔐 **Character NFT**
    - Each character is minted as an NFT and lives permanently on-chain.

---

## 🎮 Video & Screenshot

- Gameplay video: [https://youtu.be/cGXpVgoWi3o](https://youtu.be/cGXpVgoWi3o)

![Project Banner 1](/public/screenshot/readme-1.webp)

![Project Banner 2](/public/screenshot/readme-2.webp)

![Project Banner 3](/public/screenshot/readme-3.webp)

![Project Banner 4](/public/screenshot/readme-4.webp)

![Project Banner 5](/public/screenshot/readme-5.webp)

![Project Banner 6](/public/screenshot/readme-6.webp)

![Project Banner 7](/public/screenshot/readme-7.webp)

![Project Banner 8](/public/screenshot/readme-8.webp)

---

## 📁 Project Structure

```
public/
│   ├── fantasy-rpg-collection.json  # Collection Metadata
│   └── fantasy-rpg-exp.json         # EXP → Level mapping
src/
├── components/
│   ├── GameInterface.tsx   # Main game interface
│   └── WalletProvider.tsx  # Wallet Provider @solana/wallet-adapter-react-ui
├── hooks/
│   └── useMetaplexGame.ts  # Game logic & smart contract interactions with Metaplex
├── pages/
│   └── leaderboard.tsx  # Leaderboard page
├── types/
│   └── game.ts  # Type definitions (PlayerData, Monster, etc.)
├── utils/
│   ├── cache.ts  # Leaderboard caching system logic
│   └── utils.ts  # clsx & tailwind-merge
├── App.tsx  # Root
.env.example  # Required env
index.html    # HTML File
```

---

## 🛠 Tech Stack

- Frontend: **React + Vite + TypeScript + TailwindCSS**
- Wallet: `@solana/wallet-adapter-react-ui`
- Game Logic: Custom Hook `useMetaplexGame()`
- Blockchain: **Solana** using **Metaplex**
- Hosting: **Vercel**

---

## 📦 Installation

```bash
git clone https://github.com/guysuvijak/solana-fantasy-rpg.git
```

```bash
cd solana-fantasy-rpg
```

```bash
npm install
```

```bash
npm run dev
```

## 📜 License

MIT

## 🙌 Created by

- MeteorVIIx — Game Design & Blockchain & Development.
- [Aimpact.dev](https://aimpact.dev/) — AI-powered co-founder for building Solana apps without writing code.
