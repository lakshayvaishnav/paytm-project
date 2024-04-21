"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function p2pTransfer(to: string, amount: number) {
  console.log("trnasfer function called");
  const session = await getServerSession(authOptions);
  const from = session?.user?.id;
  if (!from) {
    return {
      message: "Error while sending",
    };
  }
  const toUser = await prisma.user.findFirst({
    where: {
      number: to,
    },
  });

  if (!toUser) {
    return {
      message: "User not found",
    };
  }

  // we are wrapping it in a $transaction so that if sever went down partial actions should'nt be performed....
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;

    await console.log("trnasaction function running");
    const fromBalance = await tx.balance.findUnique({
      where: { userId: Number(from) },
    });

    if (!fromBalance || fromBalance.amount < amount) {
      throw new Error("Insufficient funds");
    }

    // decrease the amount from sender...
    await tx.balance.update({
      where: { userId: Number(from) },
      data: { amount: { decrement: amount } },
    });
    console.log("balance decreacsed");

    // increase the amount of reciever...
    await tx.balance.update({
      where: { userId: toUser.id },
      data: { amount: { increment: amount } },
    });
    console.log("balance increased");

    await tx.p2pTransfer.create({
      data: {
        fromUserId: from,
        toUserId: toUser.id,
        amount,
        timestamp: new Date(),
      },
    });
  });
}
