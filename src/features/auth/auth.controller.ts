import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  //! SIGN-UP
  @Post('sign-up')
    async signUp(@Body() body: any): Promise<any> {
      return await this.authService.signUp(body);
    
  }
  
  
  //! LOGIN
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      console.log(body);
      const user = await this.authService.login(body.email, body.password);

      if (!user) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      return {
        success: true,
        message: 'Login successful',
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message || 'Login failed' },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
