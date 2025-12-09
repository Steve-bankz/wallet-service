import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet) // Temporarily inject Wallet repository here
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async findOrCreateFromGoogle(profile: any): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    if (user) {
      return user;
    }

    // User doesn't exist, create a new one and their wallet
    const newUser = this.userRepository.create({
      email: profile.email,
      name: `${profile.firstName} ${profile.lastName}`,
      googleId: profile.id, // Make sure to get the actual googleId from the profile
    });

    const savedUser = await this.userRepository.save(newUser);

    // Create a wallet for the new user
    const newWallet = this.walletRepository.create({
      user: savedUser,
      balance: 0, // Start with a zero balance
    });
    await this.walletRepository.save(newWallet);
    
    savedUser.wallet = newWallet;
    return savedUser;
  }

  async findByIdWithWallet(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id }, relations: ['wallet'] });
}
}