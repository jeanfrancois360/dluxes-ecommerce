import { Controller, Get, Post, Patch, Delete, Body, Param, Request } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@Request() req) {
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    return this.cartService.getCart(sessionId, req.user?.userId);
  }

  @Post('items')
  async addItem(@Request() req, @Body() body: any) {
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    const cart = await this.cartService.getCart(sessionId, req.user?.userId);
    return this.cartService.addItem(cart.id, body);
  }

  @Patch('items/:id')
  async updateItem(@Param('id') id: string, @Body() body: { quantity: number }) {
    return this.cartService.updateItem(id, body.quantity);
  }

  @Delete('items/:id')
  async removeItem(@Param('id') id: string) {
    return this.cartService.removeItem(id);
  }

  @Delete()
  async clearCart(@Request() req) {
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    const cart = await this.cartService.getCart(sessionId, req.user?.userId);
    return this.cartService.clearCart(cart.id);
  }
}
