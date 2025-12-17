import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../shared/domain/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase(), isDeleted: false },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Simple password check (in production, use bcrypt)
    // For this simple system, we're using plain text passwords stored in database
    // In production, compare hashed passwords: await bcrypt.compare(password, user.password)
    
    // Check if user has a password set
    if (!user.password) {
      throw new UnauthorizedException('Password not set for this user');
    }
    
    if (password !== user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Return user data (without sensitive info)
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      organization: user.organization,
      glnNumber: user.glnNumber,
      message: 'Login successful',
    };
  }

  async validateUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid user session');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      organization: user.organization,
      glnNumber: user.glnNumber,
      valid: true,
    };
  }

}
