import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UpdateProfileDto, UpdateUserRoleDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async syncUser(data: {
    firebaseUid: string;
    email: string;
    displayName?: string;
  }): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: [{ firebaseUid: data.firebaseUid }, { email: data.email }],
    });

    if (existing) {
      let needsSave = false;
      if (existing.firebaseUid !== data.firebaseUid) {
        existing.firebaseUid = data.firebaseUid;
        needsSave = true;
      }
      if (data.displayName && existing.displayName !== data.displayName) {
        existing.displayName = data.displayName;
        needsSave = true;
      }
      if (needsSave) {
        return this.usersRepository.save(existing);
      }
      return existing;
    }

    // Assign admin role if designated admin or default to citizen
    const isInitialAdmin =
      data.email.toLowerCase().startsWith('admin@') ||
      data.email.toLowerCase().includes('alessito54');

    const newUser = this.usersRepository.create({
      firebaseUid: data.firebaseUid,
      email: data.email,
      displayName:
        data.displayName ||
        data.email.split('@')[0].replace(/[._-]+/g, ' ') ||
        'Ciudadano',
      role: isInitialAdmin ? UserRole.ADMIN : UserRole.CITIZEN,
    });

    return this.usersRepository.save(newUser);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { firebaseUid } });
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    return this.usersRepository.save(user);
  }

  async updateRole(id: string, dto: UpdateUserRoleDto): Promise<User> {
    const user = await this.findById(id);
    user.role = dto.role;
    return this.usersRepository.save(user);
  }

  async findAll(limit = 50, offset = 0): Promise<{ items: User[]; total: number }> {
    const [items, total] = await this.usersRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }
}
