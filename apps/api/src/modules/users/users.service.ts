import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  private users = [
    {
      id: 'mock-user-1',
      phone: '01012345678',
      fullName: 'أحمد محمد علي',
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  ];

  async findById(id: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll() {
    return this.users;
  }
}
