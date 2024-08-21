"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const Page = () => {
  const pathname = usePathname();
  const [transactions, setTransactions] = useState<
    (VersionedTransactionResponse | null)[]
  >([]);
  const [balance, setBalance] = useState<
    | { status: "loading" }
    | {
        status: "done";
        amount: number;
      }
  >({
    status: "loading",
  });

  const connection = useMemo(
    () => new Connection(clusterApiUrl("devnet"), "confirmed"),
    []
  );

  const getBalance = useCallback(async () => {
    try {
      const publicKey = pathname.replace("/", "");
      const balance = await connection.getBalance(new PublicKey(publicKey));
      setBalance({
        status: "done",
        amount: balance,
      });
    } catch (error) {
      toast.error("Failed to fetch balance");
    }
  }, [pathname, connection]);

  const getTransactions = useCallback(async () => {
    try {
      const publicKey = pathname.replace("/", "");

      const signatures = await connection.getSignaturesForAddress(
        new PublicKey(publicKey),
        {
          limit: 10,
        }
      );

      const transactions = await Promise.all(
        signatures.map(async (signature) => {
          return await connection.getTransaction(signature.signature, {
            maxSupportedTransactionVersion: 0,
          });
        })
      );
      console.log(transactions[0]);
      setTransactions(transactions);
    } catch (error) {
      toast.error("Transaction failed");
    }
  }, [pathname, connection]);

  const getAirDrop = async () => {
    const toastId = toast.loading("Requesting airdrop", {
      description:
        "Processing , Please Wait",
    })
    try {
      const publicKey = pathname.replace("/", "");

      const signature = await connection.requestAirdrop(
        new PublicKey(new PublicKey(publicKey)),
        1 * LAMPORTS_PER_SOL
      );
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          blockhash,
          lastValidBlockHeight,
          signature,
        },
        "finalized"
      );

      toast.success("Airdrop successfull", { id: toastId });
      getTransactions();
    } catch (error) {
      toast.error("Something went wrong", {
        description:
          "Airdrop Failed",
        id: toastId,
      });
    }
  };
  useEffect(() => {
    getBalance();
    getTransactions();
  }, [pathname, getBalance, getTransactions]);

  const getAmount = (a: number | undefined, b: number | undefined): number => {
    if (!a || !b) return 0;
    return (b - a) / LAMPORTS_PER_SOL;
  };
  if (balance.status === "loading")
    return <h1 className="container md:mt-12">loading...</h1>;
  return (
    <div className="container md:mt-12 mt-6">
      <h1 className="md:text-2xl text-lg font-bold flex justify-center">Account</h1>
      <p className="font-bold flex justify-center">
        Balance : {balance.amount / LAMPORTS_PER_SOL} SOL
      </p>
      <div>
      <div className="mt-4 flex justify-center">
        <Button onClick={getAirDrop}>Request AirDrop</Button>
      </div>
      <div className="mt-5 flex justify-center"> If Airdrop fails the please visit faucet.solana.com </div>
      </div>
      <div className="mt-6">
        <Table>
          <TableCaption>A list of your recent transactions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">S.no</TableHead>
              <TableHead>Signature</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell> {transaction?.transaction.signatures} </TableCell>
                <TableCell className="text-right">
                  {getAmount(
                    transaction?.meta?.postBalances[0],
                    transaction?.meta?.preBalances[0]
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Page;
