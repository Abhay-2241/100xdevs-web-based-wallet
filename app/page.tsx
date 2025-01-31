"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import SendMoneyDialog from "@/components/sendMoney";
import { toast } from "sonner";
import WalletCard from "@/components/walletCard";

const Page = () => {
  const [walletSeed, setWalletSeed] = useState<null | {
    phrase: string;
    seed: Buffer;
  }>(null);
  const [SendMoneyDialogState, setSendMoneyDialogState] =
    useState<boolean>(false);
  const [wallets, setWallets] = useState<
    {
      secret: string;
      public: string;
    }[]
  >([]);

  useEffect(() => {
    const data = localStorage.getItem("wallet");

    if (!data) return;
    const wallet = JSON.parse(data);
    setWallets(wallet.wallets);
    setWalletSeed({
      seed: wallet.seed,
      phrase: wallet.phrase,
    });
  }, []);

  useEffect(() => {
    if (walletSeed) {
      localStorage.setItem(
        "wallet",
        JSON.stringify({
          phrase: walletSeed?.phrase,
          seed: walletSeed?.seed,
          wallets: wallets,
        })
      );
    }
  }, [walletSeed, wallets]);

  function createSeed() {
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic);
    setWalletSeed({
      phrase: mnemonic,
      seed: seed,
    });
    setWallets([]);
    toast.success("New seed phrase is added");
  }

  function createWallet() {
    if (!walletSeed) return;
    const path = `m/44'/501'/${wallets.length}'/0'`;
    const derivedSeed = derivePath(path, walletSeed.seed.toString("hex")).key;
    const secretKey = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
    const publicKey = Keypair.fromSecretKey(secretKey).publicKey.toBase58();

    setWallets((prevWallets) => {
      return [
        ...prevWallets,
        {
          secret: bs58.encode(secretKey),
          public: publicKey,
        },
      ];
    });
    toast.success("Wallet Added");
  }

  return (
    <div className="container md:mt-12 mt-6">
      <SendMoneyDialog
        state={SendMoneyDialogState}
        wallets={wallets}
        setState={setSendMoneyDialogState}
      />
      <p className="flex justify-center items-center">Generate your Phrase</p>
      <div className="flex justify-center mt-3 ">
        <div ><Button onClick={createSeed} className="rounded-3xl" >Generate Phrase</Button></div>
      </div>
      <div className="mt-5"><Input value={walletSeed?.phrase} className="rounded-2xl" /></div>
      <div className=" flex justify-center mt-6 space-x-4 ">
        <Button onClick={createWallet} variant={"outline"} className="rounded-3xl">
          Add Wallet
        </Button>
        {wallets.length >= 1 && (
          <Button onClick={() => setSendMoneyDialogState(true)} className="rounded-3xl">
            Send Money
          </Button>
        )}
      </div>
      <div className="mt-12">
        <h2 className="text-lg flex justify-center md:text-xl font-bold">Wallets</h2>
        <div className="grid mt-3 gap-6">
          {wallets.map((wallet, index) => (
            <WalletCard wallet={wallet} index={index} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
