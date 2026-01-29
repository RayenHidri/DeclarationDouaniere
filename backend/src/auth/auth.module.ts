import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const expiresInEnv = config.get<string>('JWT_ACCESS_EXPIRES_IN');
        const expiresIn =
          expiresInEnv !== undefined
            ? parseInt(expiresInEnv, 10) || 900 // fallback 900s si parsing foire
            : 900; // 900s = 15 minutes

        return {
          secret: config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me',
          signOptions: {
            expiresIn, // number => compatible avec le type attendu
          },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
