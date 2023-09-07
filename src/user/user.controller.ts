import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Request } from 'express';
import { GetUser } from '../../src/auth/decorator';
import { JwtGuard } from '../../src/auth/guard';
import { EditUserDto } from './dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {

    constructor(private userSevice: UserService) {}

    // @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getMe(@GetUser() user: User, @GetUser('email') email: string) {
        return user;
    }

    @HttpCode(HttpStatus.OK)
    @Patch()
    editUser(@GetUser('id') id: number, @Body() dto: EditUserDto) {
        return this.userSevice.editUser(id, dto)
    }
}
