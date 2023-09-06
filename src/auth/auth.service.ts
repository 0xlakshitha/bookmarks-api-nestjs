import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from 'argon2'
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {

    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService
    ) {}

    async signup(dto: AuthDto) {
        try {
            // generate hash
            const hash = await argon.hash(dto.password)

            // save user to db
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash
                }
            })

            return this.signToken(user.id, user.email)
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Credentials already exists')
                }
            }
            throw error
        }
    }

    async signin(dto: AuthDto) {
        try {
            // find user by email
            const user = await this.prisma.user.findUnique({
                where: {
                    email: dto.email
                }
            })

            // if user not found, throw error
            if (!user) {
                throw new ForbiddenException('Credentials not found')
            }

            // compare password 
            const match = await argon.verify(user.hash, dto.password)

            // if password not match, throw error
            if (!match) {
                throw new ForbiddenException('Incorrect password')
            }

            // return user
            return this.signToken(user.id, user.email)

        } catch (error) {
            throw error 
        }
    }

    async signToken(
        userId: number,
        email: string
    ): Promise<{access_token: string}> {
        const payload = {
            sub: userId,
            email 
        }

        const secret = this.config.get('JWT_SECRET')

        const token = await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret: secret
        })

        return {
            access_token: token
        }
    }

}