import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CartService } from '../cart/cart.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private cartService: CartService,
    private settingsService: SettingsService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any, sessionId?: string) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    // Merge guest cart with user cart if sessionId provided
    let cart = null;
    if (sessionId) {
      try {
        cart = await this.cartService.mergeGuestCart(sessionId, user.id);
        this.logger.log(`Merged cart for user ${user.id} from session ${sessionId}`);
      } catch (cartError) {
        this.logger.error(`Error merging cart for user ${user.id}:`, cartError);
      }
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      cart: cart ? {
        id: cart.id,
        itemCount: cart.items?.length || 0,
      } : null,
    };
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: any;
    sessionId?: string;
  }) {
    // Validate password meets requirements
    await this.validatePassword(data.password);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || ('BUYER' as any),
    });

    return this.login(user, data.sessionId);
  }

  /**
   * Get minimum password length from settings
   */
  private async getMinPasswordLength(): Promise<number> {
    try {
      const setting = await this.settingsService.getSetting('password_min_length');
      return Number(setting.value) || 8;
    } catch (error) {
      this.logger.warn('Password min length setting not found, using 8');
      return 8;
    }
  }

  /**
   * Validate password meets requirements
   */
  async validatePassword(password: string): Promise<void> {
    const minLength = await this.getMinPasswordLength();

    if (password.length < minLength) {
      throw new BadRequestException(
        `Password must be at least ${minLength} characters long`
      );
    }

    // Additional validation rules can be added here
    // For example: require uppercase, lowercase, numbers, special chars
  }
}
