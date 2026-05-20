import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function POST() {
    try {
        const email = "ajit@gmail.com"
        const isExitingUser = await prisma.user.findUnique({
            where: {
                email
            }
        })
        if (isExitingUser) {
            return NextResponse.json({ error: "User alredy Exit" }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                name: "Ajit",
                email,
                password: "123456"

            }
        })
        return NextResponse.json({ user }, { status: 200 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}