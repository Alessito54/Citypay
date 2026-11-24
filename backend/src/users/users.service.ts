import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  /**
   * Emails that get the admin role when their account is first created, from ADMIN_EMAILS
   * (comma-separated, exact match). Replaces the old rule "starts with admin@", which gave
   * admin to anyone who registered e.g. admin@gmail.com.
   */
  private adminEmails(): Set<string> {
    return new Set(
      (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  async syncUser(data: {
    firebaseUid: string;
    email: string;
    displayName?: string;
    /** Firebase `email_verified` claim. Only a verified email may link or elevate an account. */
    emailVerified?: boolean;
  }): Promise<User> {
    const email = data.email.toLowerCase();
    let existing = await this.usersRepository.findOne({ where: { firebaseUid: data.firebaseUid } });

    if (!existing) {
      const byEmail = await this.usersRepository.findOne({ where: { email } });
      if (byEmail) {
        // Linking a Firebase account to an existing profile hands over its role, so the
        // email must be proven. Otherwise anyone could register a seeded staff email.
        if (!data.emailVerified) {
          throw new ConflictException(
            'Ya existe un perfil con este correo. Verifica tu correo electrónico para vincular la cuenta.',
          );
        }
        byEmail.firebaseUid = data.firebaseUid;
        existing = await this.usersRepository.save(byEmail);
      }
    }

    if (existing) {
      if (data.displayName && existing.displayName !== data.displayName) {
        existing.displayName = data.displayName;
        return this.usersRepository.save(existing);
      }
      return existing;
    }

    const isAdmin = Boolean(data.emailVerified) && this.adminEmails().has(email);

    const newUser = this.usersRepository.create({
      firebaseUid: data.firebaseUid,
      email,
      displayName:
        data.displayName ||
        email.split('@')[0].replace(/[._-]+/g, ' ') ||
        'Ciudadano',
      role: isAdmin ? UserRole.ADMIN : UserRole.CITIZEN,
    });

    try {
      return await this.usersRepository.save(newUser);
    } catch (err: any) {
      const raced = await this.usersRepository.findOne({
        where: [{ firebaseUid: data.firebaseUid }, { email }],
      });
      if (raced) return raced;
      throw err;
    }
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
