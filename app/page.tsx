"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { BackgroundBeams } from "../components/ui/background-beams";

export default function DiceGame() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState<number>(10);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [secretSeed, setSecretSeed] = useState<string | null>(null);
  const [publicSeed, setPublicSeed] = useState<string>(uuidv4());
  const [fairness, setFairness] = useState<boolean | null>(null);

  useEffect(() => {
    setPublicSeed(uuidv4());
    localStorage.getItem("balance") && setBalance(Number(localStorage.getItem("balance")));
  }, []);

  const rollDice = async () => {
    if (bet > balance) {
      alert("Not enough balance!");
      return;
    }

    try {
      interface RollDiceResponse {
        diceRoll: number;
        hash: string;
        secretSeed: string;
      }

      const response = await axios.post<RollDiceResponse>("http://localhost:3001/roll-dice", { publicSeed });
      const { diceRoll, hash, secretSeed } = response.data;

      console.log("Dice roll:", diceRoll);
      console.log("Hash:", hash);
      console.log("Secret seed:", secretSeed);
      console.log("Public seed:", publicSeed);

      setDiceRoll(diceRoll);
      setHash(hash);
      setSecretSeed(secretSeed);

      if (!secretSeed || !publicSeed) return;

      try {
        interface VerifyRollResponse {
          computedHash: string;
        }

        console.log(publicSeed, secretSeed);

        const response = await axios.post<VerifyRollResponse>("http://localhost:3001/verify-roll", { publicSeed, secretSeed });
        const computedHash = response.data.computedHash;
        console.log("Computed hash:", computedHash);

        if (computedHash === hash) {
          setFairness(true);
        } else {
          setFairness(false);
        }
      } catch (error) {
        console.error("Error verifying fairness:", error);
      }

      // Update balance
      if (diceRoll >= 4) {
        setBalance(balance + bet); // Win (2x payout)
        localStorage.setItem("balance", String(balance + bet));
      } else {
        setBalance(balance - bet); // Lose
        localStorage.setItem("balance", String(balance - bet));
      }

    } catch (error) {
      console.error("Error rolling dice:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white gap-8">
      <h1 className="md:text-6xl text-3xl font-bold mb-4">🎲 Fair Dice Game</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <p className="text-xl">💰 Balance: ${balance}</p>

        <input
          type="number"
          value={bet}
          onChange={(e) => setBet(Number(e.target.value))}
          className="relative z-20 mt-4 p-2 text-black rounded w-full text-white bg-gray-700"
        />

        <button
          onClick={rollDice}
          className="relative z-20 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 mt-4 rounded"
        >
          Roll Dice
        </button>


        {fairness ? <p className="text-green-500 mt-4">✅ Fairness verified!</p> : fairness === false ? <p className="text-red-500 mt-4">❌ Fairness not verified!</p> : null}
        {diceRoll !== null ? <p className="mt-4">🎲 Dice roll: {diceRoll}</p> : null}
      </div>
      <BackgroundBeams />
    </div>
  );
}
